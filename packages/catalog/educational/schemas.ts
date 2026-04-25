import { z } from 'zod';

/**
 * Educational component catalog — STEM-inspired animation specs.
 * Each schema is a "tool parameter set" that the LLM fills in,
 * and a "render contract" that the component implements.
 */

// ─── StepThrough ────────────────────────────────────────────────────────
export const StepThroughSchema = z.object({
  component: z.literal('StepThrough'),
  title: z.string().optional().describe('Headline above the steps'),
  steps: z
    .array(
      z.object({
        title: z.string().describe('Short step title'),
        body: z.string().describe('1–2 sentence explanation'),
        emphasis: z.string().optional().describe('Word/phrase to highlight inside body'),
      })
    )
    .min(2)
    .max(10)
    .describe('Ordered list of teaching steps'),
  autoAdvance: z.boolean().optional().describe('Auto-advance through steps'),
  msPerStep: z.number().min(800).max(8000).optional().describe('Milliseconds per step when auto-advancing'),
  accent: z.string().optional().describe('Accent color hex'),
});
export type StepThroughSpec = z.infer<typeof StepThroughSchema>;

// ─── FunctionPlot ───────────────────────────────────────────────────────
export const FunctionPlotSchema = z.object({
  component: z.literal('FunctionPlot'),
  // Use a small DSL the component evaluates safely — never raw eval().
  expression: z
    .string()
    .describe(
      'Math expression in x. Allowed: + - * / ** ( ) and functions: sin cos tan exp log sqrt abs. e.g. "sin(x)*x", "x**2 - 4", "exp(-x*x)"'
    ),
  domain: z
    .tuple([z.number(), z.number()])
    .optional()
    .describe('[xMin, xMax] for the plot. Defaults to [-6.28, 6.28]'),
  range: z
    .tuple([z.number(), z.number()])
    .optional()
    .describe('[yMin, yMax]. Auto-fit if omitted'),
  label: z.string().optional().describe('Function label, e.g. "f(x) = sin(x)·x"'),
  traceMs: z.number().min(300).max(8000).optional().describe('How long the curve trace animation takes'),
  color: z.string().optional(),
});
export type FunctionPlotSpec = z.infer<typeof FunctionPlotSchema>;

// ─── SortingVisualizer ──────────────────────────────────────────────────
export const SortingVisualizerSchema = z.object({
  component: z.literal('SortingVisualizer'),
  algorithm: z.enum(['bubble', 'insertion', 'selection', 'merge', 'quick']),
  size: z.number().int().min(8).max(80).optional().describe('Number of array elements'),
  speedMs: z.number().min(8).max(400).optional().describe('Milliseconds between visual swaps'),
  seed: z.number().int().optional().describe('Deterministic seed for the input array'),
  label: z.string().optional(),
});
export type SortingVisualizerSpec = z.infer<typeof SortingVisualizerSchema>;

// ─── PhysicsScene ───────────────────────────────────────────────────────
export const PhysicsSceneSchema = z.object({
  component: z.literal('PhysicsScene'),
  preset: z
    .enum(['gravity', 'pendulum', 'wave', 'collisions', 'orbit'])
    .describe('Scene preset that defines initial bodies and forces'),
  gravity: z.number().min(-2).max(2).optional().describe('Gravity strength (negative = upward)'),
  bodies: z
    .number()
    .int()
    .min(2)
    .max(80)
    .optional()
    .describe('Number of bodies for collisions/orbit presets'),
  label: z.string().optional(),
  trails: z.boolean().optional().describe('Render trailing paths'),
  accent: z.string().optional(),
});
export type PhysicsSceneSpec = z.infer<typeof PhysicsSceneSchema>;

// ─── TimelineEvent ──────────────────────────────────────────────────────
export const TimelineEventSchema = z.object({
  component: z.literal('TimelineEvent'),
  title: z.string().optional(),
  events: z
    .array(
      z.object({
        year: z.string().describe('e.g. "1969", "c. 500 BCE", "Q3 2024"'),
        title: z.string(),
        body: z.string().optional(),
      })
    )
    .min(2)
    .max(12),
  orientation: z.enum(['horizontal', 'vertical']).optional(),
  accent: z.string().optional(),
});
export type TimelineEventSpec = z.infer<typeof TimelineEventSchema>;

// ─── CodeWalkthrough ────────────────────────────────────────────────────
export const CodeWalkthroughSchema = z.object({
  component: z.literal('CodeWalkthrough'),
  language: z
    .enum(['javascript', 'typescript', 'python', 'rust', 'go', 'cpp', 'sql'])
    .optional(),
  title: z.string().optional(),
  // Each "line group" is revealed and may carry an explanation.
  steps: z
    .array(
      z.object({
        code: z.string().describe('Code lines, can be multi-line. Use \\n for newlines.'),
        explain: z.string().optional().describe('Plain-language commentary shown beside the highlight'),
      })
    )
    .min(1)
    .max(20),
  msPerStep: z.number().min(400).max(6000).optional(),
});
export type CodeWalkthroughSpec = z.infer<typeof CodeWalkthroughSchema>;

// ─── Catalog union ──────────────────────────────────────────────────────
export const EducationalSchemas = {
  StepThrough: StepThroughSchema,
  FunctionPlot: FunctionPlotSchema,
  SortingVisualizer: SortingVisualizerSchema,
  PhysicsScene: PhysicsSceneSchema,
  TimelineEvent: TimelineEventSchema,
  CodeWalkthrough: CodeWalkthroughSchema,
} as const;
