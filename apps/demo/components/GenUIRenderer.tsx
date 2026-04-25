'use client';

import { lazy, Suspense } from 'react';
import type { ComponentSpec } from '@/lib/schemas';

// Each renderer is code-split — only the bundle for the chosen component
// loads. The Suspense fallback is a black layer so the canvas never flashes
// while the component is still streaming in.

const ParticleFieldPixi = lazy(() =>
  import('./renderers/ParticleFieldPixi').then((m) => ({ default: m.ParticleFieldPixi }))
);
const Waveform = lazy(() =>
  import('./renderers/Waveform').then((m) => ({ default: m.Waveform }))
);
const ConceptDiagram = lazy(() =>
  import('./renderers/ConceptDiagram').then((m) => ({ default: m.ConceptDiagram }))
);
const Counter = lazy(() =>
  import('./renderers/Counter').then((m) => ({ default: m.Counter }))
);
const TextReveal = lazy(() =>
  import('./renderers/TextReveal').then((m) => ({ default: m.TextReveal }))
);
const LiveGenSandbox = lazy(() =>
  import('./renderers/LiveGenSandbox').then((m) => ({ default: m.LiveGenSandbox }))
);

// Educational catalog (issue #4)
const StepThrough = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.StepThrough }))
);
const FunctionPlot = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.FunctionPlot }))
);
const SortingVisualizer = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.SortingVisualizer }))
);
const PhysicsScene = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.PhysicsScene }))
);
const TimelineEvent = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.TimelineEvent }))
);
const CodeWalkthrough = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.CodeWalkthrough }))
);

// Rive (issue #5)
const RivePlayer = lazy(() =>
  import('@fgu/renderer/rive').then((m) => ({ default: m.RivePlayer }))
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

        {spec.component === 'StepThrough' && <StepThrough spec={spec} />}
        {spec.component === 'FunctionPlot' && <FunctionPlot spec={spec} />}
        {spec.component === 'SortingVisualizer' && <SortingVisualizer spec={spec} />}
        {spec.component === 'PhysicsScene' && <PhysicsScene spec={spec} />}
        {spec.component === 'TimelineEvent' && <TimelineEvent spec={spec} />}
        {spec.component === 'CodeWalkthrough' && <CodeWalkthrough spec={spec} />}

        {spec.component === 'RiveAnimation' && <RivePlayer spec={spec} />}
      </div>
    </Suspense>
  );
}
