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
  // Fail fast on missing key — otherwise the SSE stream opens, the client
  // waits, and the failure only surfaces on the first model call as an
  // opaque "fetch failed" inside the event payload.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server' },
      { status: 500 }
    );
  }

  let prompt: string;
  let language: string | undefined;
  try {
    const body = (await req.json()) as { prompt?: string; language?: string };
    prompt = (body.prompt ?? '').trim();
    language = body.language;
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

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
