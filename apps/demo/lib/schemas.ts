import { z } from 'zod';
import { EducationalSchemas } from '@fgu/catalog/educational';
import { RiveAnimationSchema } from '@fgu/renderer/rive';

// ─── Pre-built (existing) components ────────────────────────────────────

export const ParticleFieldSchema = z.object({
  component: z.literal('ParticleField'),
  count: z.number().min(100).max(10000).optional().describe('Number of particles (100–10000)'),
  speed: z.number().min(0.1).max(3).optional().describe('Particle speed multiplier'),
  color: z.string().optional().describe('Particle color as hex, e.g. #ffffff'),
  interactive: z.boolean().optional().describe('React to mouse movement'),
  label: z.string().optional(),
});
export type ParticleFieldSpec = z.infer<typeof ParticleFieldSchema>;

export const WaveformSchema = z.object({
  component: z.literal('Waveform'),
  frequency: z.number().min(0.5).max(10).optional().describe('Wave frequency'),
  amplitude: z.number().min(0.1).max(1).optional().describe('Wave amplitude 0–1'),
  waves: z.number().min(1).max(8).optional().describe('Number of waves'),
  color: z.string().optional().describe('Wave color as hex'),
  label: z.string().optional(),
});
export type WaveformSpec = z.infer<typeof WaveformSchema>;

export const ConceptDiagramSchema = z.object({
  component: z.literal('ConceptDiagram'),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        size: z.number().optional(),
        color: z.string().optional(),
      })
    )
    .min(2)
    .max(20),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    })
  ),
  title: z.string().optional(),
});
export type ConceptDiagramSpec = z.infer<typeof ConceptDiagramSchema>;

export const CounterSchema = z.object({
  component: z.literal('Counter'),
  value: z.number().describe('Target value to count up to'),
  duration: z.number().min(0.5).max(8).optional().describe('Animation duration in seconds'),
  label: z.string().optional(),
  prefix: z.string().optional().describe('e.g. $ or €'),
  suffix: z.string().optional().describe('e.g. K, M, %, x'),
  color: z.string().optional(),
});
export type CounterSpec = z.infer<typeof CounterSchema>;

export const TextRevealSchema = z.object({
  component: z.literal('TextReveal'),
  text: z.string().describe('The text to reveal word by word'),
  highlight: z.array(z.string()).optional().describe('Words to highlight'),
  speed: z.number().min(0.1).max(3).optional().describe('Reveal speed multiplier'),
  size: z.enum(['sm', 'md', 'lg', 'xl', '2xl']).optional(),
  color: z.string().optional(),
});
export type TextRevealSpec = z.infer<typeof TextRevealSchema>;

// ─── Live-gen channel ───────────────────────────────────────────────────

export const LiveGenSchema = z.object({
  component: z.literal('LiveGen'),
  runtime: z
    .enum(['canvas', 'react'])
    .describe('canvas = vanilla Canvas 2D API; react = JSX with React 19 hooks'),
  code: z
    .string()
    .describe(
      'For canvas: plain JS using canvas/ctx variables already set up. ' +
        'For react: JSX defining an App component (default export not needed, just define App).'
    ),
  backgroundColor: z.string().optional().describe('Background color hex'),
  description: z.string().optional().describe('One-line description of what this renders'),
});
export type LiveGenSpec = z.infer<typeof LiveGenSchema>;

// ─── Educational catalog (re-exported from packages/catalog/educational) ─
export {
  StepThroughSchema,
  FunctionPlotSchema,
  SortingVisualizerSchema,
  PhysicsSceneSchema,
  TimelineEventSchema,
  CodeWalkthroughSchema,
} from '@fgu/catalog/educational';
export type {
  StepThroughSpec,
  FunctionPlotSpec,
  SortingVisualizerSpec,
  PhysicsSceneSpec,
  TimelineEventSpec,
  CodeWalkthroughSpec,
} from '@fgu/catalog/educational';

// ─── Rive renderer (separate package) ───────────────────────────────────
export { RiveAnimationSchema } from '@fgu/renderer/rive';
export type { RiveAnimationSpec } from '@fgu/renderer/rive';

// ─── Discriminated union ────────────────────────────────────────────────

export const ComponentSpecSchema = z.discriminatedUnion('component', [
  ParticleFieldSchema,
  WaveformSchema,
  ConceptDiagramSchema,
  CounterSchema,
  TextRevealSchema,
  LiveGenSchema,
  EducationalSchemas.StepThrough,
  EducationalSchemas.FunctionPlot,
  EducationalSchemas.SortingVisualizer,
  EducationalSchemas.PhysicsScene,
  EducationalSchemas.TimelineEvent,
  EducationalSchemas.CodeWalkthrough,
  RiveAnimationSchema,
]);

export type ComponentSpec = z.infer<typeof ComponentSpecSchema>;
