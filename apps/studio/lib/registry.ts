import {
  StepThroughSchema,
  FunctionPlotSchema,
  SortingVisualizerSchema,
  PhysicsSceneSchema,
  TimelineEventSchema,
  CodeWalkthroughSchema,
} from '@fgu/catalog/educational';
import type { z } from 'zod';

/**
 * Studio's view of the component catalog.
 *
 * Each entry binds:
 *   - the human label and a one-line teaser
 *   - the Zod schema used to drive both validation and form generation
 *   - a starter spec the form fills in on first load
 *
 * Renderers are imported lazily from the studio side because they include
 * client-only code (PixiJS, Rive, Web Audio) that must not run during SSR.
 */

export interface CatalogEntry<S extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  label: string;
  description: string;
  schema: S;
  initialValue: z.infer<S>;
}

export const CATALOG: CatalogEntry[] = [
  {
    id: 'StepThrough',
    label: 'Step-through',
    description:
      'Auto-advancing list of teaching steps with optional emphasis word.',
    schema: StepThroughSchema,
    initialValue: {
      component: 'StepThrough',
      title: 'Photosynthesis',
      autoAdvance: true,
      msPerStep: 2400,
      accent: '#f59e0b',
      steps: [
        {
          title: 'Light hits the leaf',
          body: 'Chlorophyll molecules in the chloroplasts absorb visible light, mostly red and blue.',
          emphasis: 'chlorophyll',
        },
        {
          title: 'Water splits',
          body: 'Photons strip electrons from H₂O, releasing oxygen as a by-product.',
          emphasis: 'oxygen',
        },
        {
          title: 'Carbon is fixed',
          body: 'CO₂ is bound to a sugar precursor, ultimately yielding glucose.',
          emphasis: 'glucose',
        },
      ],
    } as z.infer<typeof StepThroughSchema>,
  },
  {
    id: 'FunctionPlot',
    label: 'Function plot',
    description: 'Animated trace of any allow-listed math function in x.',
    schema: FunctionPlotSchema,
    initialValue: {
      component: 'FunctionPlot',
      expression: 'sin(x) * exp(-x*x*0.05)',
      domain: [-10, 10],
      label: 'damped sine',
      traceMs: 1800,
      color: '#22d3ee',
    } as z.infer<typeof FunctionPlotSchema>,
  },
  {
    id: 'SortingVisualizer',
    label: 'Sorting visualizer',
    description: 'Animated bubble / insertion / selection / merge / quick sort.',
    schema: SortingVisualizerSchema,
    initialValue: {
      component: 'SortingVisualizer',
      algorithm: 'merge',
      size: 32,
      speedMs: 28,
      seed: 7,
      label: 'Merge sort, n = 32',
    } as z.infer<typeof SortingVisualizerSchema>,
  },
  {
    id: 'PhysicsScene',
    label: 'Physics scene',
    description: 'Lightweight physics demo — gravity / pendulum / wave / collisions / orbit.',
    schema: PhysicsSceneSchema,
    initialValue: {
      component: 'PhysicsScene',
      preset: 'orbit',
      bodies: 28,
      gravity: 0.4,
      label: 'Orbital mechanics',
      trails: true,
      accent: '#a78bfa',
    } as z.infer<typeof PhysicsSceneSchema>,
  },
  {
    id: 'TimelineEvent',
    label: 'Timeline',
    description: 'Animated event timeline (horizontal or vertical).',
    schema: TimelineEventSchema,
    initialValue: {
      component: 'TimelineEvent',
      title: 'Space race',
      orientation: 'horizontal',
      accent: '#fb7185',
      events: [
        { year: '1957', title: 'Sputnik 1', body: 'First artificial satellite.' },
        { year: '1961', title: 'Vostok 1', body: 'First human in orbit.' },
        { year: '1969', title: 'Apollo 11', body: 'Crewed lunar landing.' },
      ],
    } as z.infer<typeof TimelineEventSchema>,
  },
  {
    id: 'CodeWalkthrough',
    label: 'Code walkthrough',
    description: 'Step-by-step code reveal with highlighting and commentary.',
    schema: CodeWalkthroughSchema,
    initialValue: {
      component: 'CodeWalkthrough',
      language: 'typescript',
      title: 'Memoized fib',
      msPerStep: 1800,
      steps: [
        {
          code: 'const cache = new Map<number, number>();',
          explain: 'Use a Map to memoize previous results.',
        },
        {
          code: 'function fib(n: number): number {\n  if (n < 2) return n;',
          explain: 'Base case — fib(0)=0, fib(1)=1.',
        },
        {
          code: '  if (cache.has(n)) return cache.get(n)!;',
          explain: 'Return the cached value when we have one.',
        },
        {
          code: '  const v = fib(n - 1) + fib(n - 2);\n  cache.set(n, v);\n  return v;\n}',
          explain: 'Compute, store, return.',
        },
      ],
    } as z.infer<typeof CodeWalkthroughSchema>,
  },
];
