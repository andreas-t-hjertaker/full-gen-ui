import { anthropic } from '@ai-sdk/anthropic';
import { genUITools } from '@/lib/tools';
import { orchestrateLesson } from '@fgu/core/agent';
import { AGUIEmitter, newRunId } from '@fgu/core/streaming';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * Educational orchestration endpoint (issue #6).
 *
 * Body: `{ prompt: string, language?: string }`.
 * Streams AG-UI events as the curriculum is generated. Each lesson segment
 * is emitted as a `CUSTOM` event named `curriculum_entry` carrying a
 * `CurriculumEntry`. The client's `EducationPlayer` listens for these and
 * plays them in sequence with synchronized narration.
 */
export async function POST(req: Request) {
  const { prompt, language } = (await req.json()) as {
    prompt: string;
    language?: string;
  };

  const emitter = new AGUIEmitter();
  const runId = newRunId();

  (async () => {
    emitter.emit({ type: 'RUN_STARTED', runId, timestamp: Date.now() });

    try {
      const curriculum = await orchestrateLesson({
        model: anthropic('claude-sonnet-4-5'),
        visualTools: genUITools,
        userPrompt: prompt,
        language,
        onSegment: (entry) => {
          emitter.emit({
            type: 'CUSTOM',
            name: 'curriculum_entry',
            payload: entry,
            timestamp: Date.now(),
          });
        },
      });

      emitter.emit({
        type: 'CUSTOM',
        name: 'curriculum_complete',
        payload: { topic: curriculum.topic, language: curriculum.language },
        timestamp: Date.now(),
      });
      emitter.finish(runId);
    } catch (e) {
      emitter.error(runId, e instanceof Error ? e.message : String(e));
    }
  })();

  return new Response(emitter.stream, { headers: emitter.headers });
}
