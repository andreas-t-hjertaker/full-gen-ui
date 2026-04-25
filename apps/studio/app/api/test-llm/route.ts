import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import {
  StepThroughSchema,
  FunctionPlotSchema,
  SortingVisualizerSchema,
  PhysicsSceneSchema,
  TimelineEventSchema,
  CodeWalkthroughSchema,
} from '@fgu/catalog/educational';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * "Test with LLM" — given a user prompt, run the educational tool surface
 * and return the chosen component + its parameters. The studio uses this
 * to validate that the catalog descriptions are precise enough for the
 * model to consistently pick the intended component.
 *
 * Returns: `{ chosen: ComponentId, spec: ComponentSpec }` or `{ error }`.
 */
const tools = {
  renderStepThrough: tool({
    description: 'Animated step-by-step explanation with optional auto-advance.',
    parameters: StepThroughSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'StepThrough' as const, ...args }),
  }),
  renderFunctionPlot: tool({
    description:
      'Plot a math function in x with an animated trace. Allowed: + - * / ** sin cos tan exp log sqrt abs pow.',
    parameters: FunctionPlotSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'FunctionPlot' as const, ...args }),
  }),
  renderSortingVisualizer: tool({
    description: 'Animated bubble / insertion / selection / merge / quick sort.',
    parameters: SortingVisualizerSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'SortingVisualizer' as const, ...args }),
  }),
  renderPhysicsScene: tool({
    description:
      'Physics simulation: gravity, pendulum, wave, collisions or orbit.',
    parameters: PhysicsSceneSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'PhysicsScene' as const, ...args }),
  }),
  renderTimelineEvent: tool({
    description: 'Animated event timeline (horizontal or vertical).',
    parameters: TimelineEventSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'TimelineEvent' as const, ...args }),
  }),
  renderCodeWalkthrough: tool({
    description: 'Step-by-step code reveal with annotations.',
    parameters: CodeWalkthroughSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'CodeWalkthrough' as const, ...args }),
  }),
};

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }
    const { prompt } = (await req.json()) as { prompt: string };
    if (!prompt) {
      return Response.json({ error: 'prompt required' }, { status: 400 });
    }

    const result = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      system:
        'You are a generative UI engine. Pick exactly one render tool that best fits the user request and produce specific, contextual parameters.',
      prompt,
      tools,
      toolChoice: 'required',
    });

    for (const step of result.steps ?? []) {
      for (const r of step.toolResults ?? []) {
        const payload = (r as { result?: unknown }).result ?? r;
        if (
          payload &&
          typeof payload === 'object' &&
          'component' in (payload as Record<string, unknown>)
        ) {
          const spec = payload as Record<string, unknown>;
          return Response.json({ chosen: spec.component, spec });
        }
      }
    }
    return Response.json({ error: 'LLM did not produce a component spec' }, { status: 500 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
