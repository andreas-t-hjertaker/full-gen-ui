import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { componentTools } from '@/lib/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: `You are a visual AI interface. When a user asks you something,
you respond by selecting the most appropriate visual component from your tools.

ALWAYS prefer a visual response over plain text.
Choose the component that best communicates the answer visually.

If the user asks about a concept, animate it.
If the user asks about data, visualize it.
If the user asks for something creative, generate it.

Only fall back to plain text if absolutely no visual component is appropriate.`,
    messages,
    tools: componentTools,
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
