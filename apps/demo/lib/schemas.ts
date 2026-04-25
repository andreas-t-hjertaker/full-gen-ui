import { z } from 'zod';

/**
 * Zod schemas for every visual component.
 * These are consumed by the AI SDK as tool parameter schemas.
 * The LLM sees these descriptions and populates the fields.
 * Zod validates the output before anything reaches the renderer.
 */

export const ParticleFieldSchema = z.object({
  count: z
    .number()
    .min(50)
    .max(5000)
    .default(800)
    .describe('Number of particles to render'),
  color: z
    .string()
    .default('#6366f1')
    .describe('Primary particle color as hex'),
  secondaryColor: z
    .string()
    .optional()
    .describe('Optional secondary color for gradient effect'),
  speed: z
    .number()
    .min(0.1)
    .max(5)
    .default(1)
    .describe('Movement speed multiplier'),
  label: z
    .string()
    .optional()
    .describe('Optional text label shown over the particle field'),
  interactive: z
    .boolean()
    .default(true)
    .describe('Whether particles react to mouse movement'),
});

export const WaveformSchema = z.object({
  frequency: z
    .number()
    .min(0.5)
    .max(10)
    .default(2)
    .describe('Wave frequency'),
  amplitude: z
    .number()
    .min(0.1)
    .max(1)
    .default(0.4)
    .describe('Wave amplitude as fraction of canvas height'),
  waveCount: z
    .number()
    .min(1)
    .max(8)
    .default(3)
    .describe('Number of overlapping waves'),
  color: z.string().default('#06b6d4').describe('Wave color as hex'),
  label: z.string().optional().describe('Label shown above the waveform'),
});

export const ConceptDiagramSchema = z.object({
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().describe('Node display text'),
        color: z.string().optional().describe('Node color as hex'),
      })
    )
    .min(2)
    .max(12)
    .describe('Concept nodes'),
  edges: z
    .array(
      z.object({
        from: z.string().describe('Source node id'),
        to: z.string().describe('Target node id'),
        label: z.string().optional().describe('Edge label'),
      })
    )
    .describe('Connections between nodes'),
  title: z.string().optional().describe('Diagram title'),
  layout: z
    .enum(['radial', 'tree', 'force'])
    .default('force')
    .describe('Layout algorithm'),
});

export const CounterSchema = z.object({
  value: z.number().describe('The final number to count to'),
  duration: z
    .number()
    .min(0.5)
    .max(8)
    .default(2.5)
    .describe('Animation duration in seconds'),
  prefix: z.string().optional().describe('Text before the number, e.g. "$"'),
  suffix: z.string().optional().describe('Text after the number, e.g. "%" or "M"'),
  label: z.string().optional().describe('Explanatory label below the number'),
  color: z.string().default('#f59e0b').describe('Number color as hex'),
});

export const TextRevealSchema = z.object({
  text: z.string().min(1).max(300).describe('The text to reveal word by word'),
  highlightWords: z
    .array(z.string())
    .optional()
    .describe('Words to highlight in accent color'),
  speed: z
    .number()
    .min(0.5)
    .max(3)
    .default(1)
    .describe('Reveal speed multiplier'),
  size: z
    .enum(['sm', 'md', 'lg', 'xl'])
    .default('lg')
    .describe('Text size'),
  color: z.string().default('#ffffff').describe('Base text color'),
});

// Union type for all component specs
export type ComponentSpec =
  | ({ component: 'particleField' } & z.infer<typeof ParticleFieldSchema>)
  | ({ component: 'waveform' } & z.infer<typeof WaveformSchema>)
  | ({ component: 'conceptDiagram' } & z.infer<typeof ConceptDiagramSchema>)
  | ({ component: 'counter' } & z.infer<typeof CounterSchema>)
  | ({ component: 'textReveal' } & z.infer<typeof TextRevealSchema>);
