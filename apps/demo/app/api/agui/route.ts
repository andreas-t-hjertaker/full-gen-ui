import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { genUITools } from '@/lib/tools';
import { AGUIEmitter, bridgeAiSdkToAGUI, newRunId } from '@fgu/core/streaming';

export const runtime = 'edge';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a generative UI engine. Your ONLY job is to call one of the provided render tools.
Pick the most visually compelling, contextually relevant tool. Prefer the educational catalog
(renderStepThrough, renderFunctionPlot, renderSortingVisualizer, renderPhysicsScene,
renderTimelineEvent, renderCodeWalkthrough) for any "how does X work" / explanation prompt.`;

/**
 * AG-UI compatible chat endpoint.
 *
 * The browser POSTs `{ messages, threadId? }` and gets a long-lived SSE
 * response of canonical AG-UI events. The endpoint is independent from
 * `/api/chat` — apps can mount either, or both, depending on whether they
 * use Vercel AI SDK's `useChat` hook or the AG-UI `useAGUI` hook.
 */
export async function POST(req: Request) {
  const { messages } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  };

  const emitter = new AGUIEmitter();
  const runId = newRunId();

  // Kick off the model run async — emitter starts streaming back to the client
  // immediately, even before the model produces its first token.
  (async () => {
    try {
      const result = streamText({
        model: anthropic('claude-sonnet-4-5'),
        system: SYSTEM_PROMPT,
        messages,
        tools: genUITools,
        maxSteps: 3,
      });
      await bridgeAiSdkToAGUI(result, emitter, { runId });
    } catch (e) {
      emitter.error(runId, e instanceof Error ? e.message : String(e));
    }
  })();

  return new Response(emitter.stream, { headers: emitter.headers });
}
