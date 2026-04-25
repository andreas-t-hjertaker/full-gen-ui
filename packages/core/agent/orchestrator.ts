import { generateObject, generateText, type ToolSet } from 'ai';
import {
  OrchestratorDecisionSchema,
  LessonPlanSchema,
  type Curriculum,
  type CurriculumEntry,
  type LessonPlan,
  type OrchestratorDecision,
} from './schemas';
import {
  ORCHESTRATOR_PROMPT,
  CONTENT_AGENT_PROMPT,
  VISUAL_AGENT_PROMPT,
  NARRATION_AGENT_PROMPT,
} from './roles';

export interface OrchestrateOptions {
  model: Parameters<typeof generateText>[0]['model'];
  /** The full LLM tool set (renderXxx tools). Required for the visual agent. */
  visualTools: ToolSet;
  userPrompt: string;
  /** Optional override for the orchestrator-decided language. */
  language?: string;
  onSegment?: (entry: CurriculumEntry) => void;
}

/**
 * Run the four-role pipeline:
 *   1. Orchestrator      — routing decision (isLesson, domain, depth)
 *   2. Content agent     — produces a `LessonPlan` (segments)
 *   3. Visual agent      — for each segment, picks a render tool + parameters
 *   4. Narration agent   — for each segment, writes the voice-over
 *
 * Steps 3 and 4 run in parallel per-segment because they don't depend on each
 * other. The result is a `Curriculum` that the player on the client can scrub
 * through, with synchronized narration.
 */
export async function orchestrateLesson(
  opts: OrchestrateOptions
): Promise<Curriculum> {
  const { model, visualTools, userPrompt, onSegment } = opts;

  // 1. Orchestrator decision
  const decision = await runOrchestrator(model, userPrompt);

  // If not a lesson, the caller should fall back to the simple chat route.
  if (!decision.isLesson) {
    return {
      topic: userPrompt,
      language: opts.language ?? decision.language,
      entries: [],
    };
  }

  // 2. Content agent
  const plan = await runContentAgent(model, userPrompt, decision);

  // 3 + 4. Visual + narration per segment, in parallel.
  // Per-segment errors fall back to a TextReveal of the segment body —
  // partial failure is far better than tossing the whole lesson because one
  // tool call hallucinated bad arguments.
  const language = opts.language ?? decision.language ?? 'en-US';
  const entries = await Promise.all(
    plan.segments.map(async (seg, index): Promise<CurriculumEntry> => {
      const [visual, narration] = await Promise.allSettled([
        runVisualAgent(model, visualTools, seg, plan, decision),
        runNarrationAgent(model, seg, language),
      ]);
      const componentSpec =
        visual.status === 'fulfilled'
          ? visual.value
          : ({
              component: 'TextReveal',
              text: seg.body,
              size: 'md',
            } as const);
      const narrationText =
        narration.status === 'fulfilled' ? narration.value : seg.body;
      const entry: CurriculumEntry = {
        index,
        title: seg.title,
        narration: narrationText,
        componentSpec,
        holdSeconds: seg.approxSeconds,
      };
      onSegment?.(entry);
      return entry;
    })
  );

  return {
    topic: plan.topic,
    language,
    entries,
  };
}

// ─── Individual agents ──────────────────────────────────────────────────

async function runOrchestrator(
  model: OrchestrateOptions['model'],
  userPrompt: string
): Promise<OrchestratorDecision> {
  const { object } = await generateObject({
    model,
    system: ORCHESTRATOR_PROMPT,
    prompt: `User said: ${JSON.stringify(userPrompt)}`,
    schema: OrchestratorDecisionSchema,
  });
  return object;
}

async function runContentAgent(
  model: OrchestrateOptions['model'],
  userPrompt: string,
  decision: OrchestratorDecision
): Promise<LessonPlan> {
  const { object } = await generateObject({
    model,
    system: CONTENT_AGENT_PROMPT,
    prompt: [
      `Topic: ${userPrompt}`,
      `Domain: ${decision.domain}`,
      `Segments: ${decision.segmentCount}`,
      `Depth: ${decision.depth}`,
      `Language for output: ${decision.language ?? 'auto-detect from topic'}`,
    ].join('\n'),
    schema: LessonPlanSchema,
  });
  return object;
}

async function runVisualAgent(
  model: OrchestrateOptions['model'],
  visualTools: ToolSet,
  segment: { title: string; body: string; concept: string },
  plan: LessonPlan,
  decision: OrchestratorDecision
): Promise<unknown> {
  const result = await generateText({
    model,
    system: VISUAL_AGENT_PROMPT,
    prompt: [
      `Lesson topic: ${plan.topic}`,
      `Domain: ${decision.domain}`,
      `Segment title: ${segment.title}`,
      `Segment body: ${segment.body}`,
      `Concrete concept to animate: ${segment.concept}`,
    ].join('\n'),
    tools: visualTools,
    toolChoice: 'required',
  });

  // Pick the first non-error tool result — that's our component spec.
  for (const step of result.steps ?? []) {
    for (const r of step.toolResults ?? []) {
      // Some adapters wrap result in {result}; tolerate both.
      const payload = (r as { result?: unknown }).result ?? r;
      if (
        payload &&
        typeof payload === 'object' &&
        'component' in (payload as Record<string, unknown>)
      ) {
        return payload;
      }
    }
  }

  throw new Error(
    `visual agent did not produce a component spec for segment "${segment.title}"`
  );
}

async function runNarrationAgent(
  model: OrchestrateOptions['model'],
  segment: { title: string; body: string; concept: string },
  language: string
): Promise<string> {
  const { text } = await generateText({
    model,
    system: NARRATION_AGENT_PROMPT,
    prompt: [
      `Language: ${language}`,
      `Segment title: ${segment.title}`,
      `Segment body: ${segment.body}`,
      `Animatable concept: ${segment.concept}`,
    ].join('\n'),
  });
  return text.trim();
}
