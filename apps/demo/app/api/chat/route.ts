import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { genUITools } from '@/lib/tools';

export const runtime = 'edge';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a generative UI engine. Your ONLY job is to call one of the provided render tools.
Never respond with plain text. Always pick the most visually compelling and contextually relevant tool.

Tool selection guide:
- renderParticleField: abstract concepts, energy, space, ambience, "something beautiful"
- renderWaveform: sound, music, frequency, rhythm, signal, heartbeat, EEG, radio
- renderConceptDiagram: systems, architecture, relationships, networks, how things connect
- renderCounter: numbers, statistics, records, scale ("how many X", "X per day", milestones)
- renderTextReveal: quotes, insights, key messages, definitions, important sentences
- renderLiveGen: anything unique, creative, or complex that the above can't express well
  Examples: fractals, cellular automata, physics simulations, custom data visualizations,
  interactive games, algorithmic art, educational math animations.

For renderLiveGen:
- Prefer canvas runtime for performance (particles, physics, math animations)
- Prefer react runtime for interactive UI with state
- For canvas: variables canvas and ctx are pre-set. Use requestAnimationFrame for loops.
- For react: define App as a React function component. useState/useEffect/useRef are available.
- Write complete, self-contained code. No imports needed for canvas. For react, hooks are imported.
- Make the code visually stunning and contextually relevant to the user's prompt.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages,
    tools: genUITools,
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
