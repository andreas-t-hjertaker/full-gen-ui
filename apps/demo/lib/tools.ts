import { tool } from 'ai';
import {
  ParticleFieldSchema,
  WaveformSchema,
  ConceptDiagramSchema,
  CounterSchema,
  TextRevealSchema,
} from '@/lib/schemas';

/**
 * Component tools — the visual vocabulary the LLM selects from.
 * Each tool = one animated component the LLM can "call" to put on screen.
 */
export const componentTools = {
  particleField: tool({
    description:
      'Render a GPU-accelerated particle field. Use for abstract topics, atmospheres, energy, emotion, open-ended questions.',
    parameters: ParticleFieldSchema,
    execute: async (params) => ({ component: 'particleField', ...params }),
  }),

  waveform: tool({
    description:
      'Animate a flowing waveform. Use for audio concepts, oscillation, frequency, rhythm, cycles, data over time.',
    parameters: WaveformSchema,
    execute: async (params) => ({ component: 'waveform', ...params }),
  }),

  conceptDiagram: tool({
    description:
      'Show an animated concept diagram with nodes and connecting arrows. Use for explaining systems, relationships, flows, hierarchies, processes.',
    parameters: ConceptDiagramSchema,
    execute: async (params) => ({ component: 'conceptDiagram', ...params }),
  }),

  counter: tool({
    description:
      'Animate a large number counting up. Use for statistics, quantities, impressive facts, data points.',
    parameters: CounterSchema,
    execute: async (params) => ({ component: 'counter', ...params }),
  }),

  textReveal: tool({
    description:
      'Reveal key text word-by-word with a cinematic animation. Use for highlighting important insights, quotes, definitions, key takeaways.',
    parameters: TextRevealSchema,
    execute: async (params) => ({ component: 'textReveal', ...params }),
  }),
};
