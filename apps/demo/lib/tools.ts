import { tool } from 'ai';
import {
  ParticleFieldSchema,
  WaveformSchema,
  ConceptDiagramSchema,
  CounterSchema,
  TextRevealSchema,
  LiveGenSchema,
} from './schemas';

export const genUITools = {
  renderParticleField: tool({
    description:
      'Render an animated GPU-accelerated particle field. Use for abstract, ambient, or energy-related concepts. Supports mouse interaction.',
    parameters: ParticleFieldSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'ParticleField' as const, ...args }),
  }),

  renderWaveform: tool({
    description:
      'Render an animated waveform. Use for sound, frequency, oscillation, heartbeat, signal, or rhythm concepts.',
    parameters: WaveformSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'Waveform' as const, ...args }),
  }),

  renderConceptDiagram: tool({
    description:
      'Render a force-directed concept diagram with nodes and edges. Use for systems, relationships, architectures, networks, or knowledge graphs.',
    parameters: ConceptDiagramSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'ConceptDiagram' as const, ...args }),
  }),

  renderCounter: tool({
    description:
      'Render a large animated number counting up. Use for statistics, milestones, metrics, scores, or impressive numbers.',
    parameters: CounterSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'Counter' as const, ...args }),
  }),

  renderTextReveal: tool({
    description:
      'Render text that reveals word by word with optional highlighting. Use for quotes, insights, definitions, or key messages.',
    parameters: TextRevealSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'TextReveal' as const, ...args }),
  }),

  renderLiveGen: tool({
    description:
      'Generate and render custom animation code live in the browser — zero build step. ' +
      'Use this for unique, creative, or complex visualizations not covered by other components. ' +
      'Choose runtime="canvas" for performance-critical animations (particles, physics, fractals, cellular automata). ' +
      'Choose runtime="react" for interactive UI with state and hooks. ' +
      'IMPORTANT: For canvas, the variables `canvas` (HTMLCanvasElement) and `ctx` (CanvasRenderingContext2D) are pre-defined. ' +
      'Use requestAnimationFrame for animation loops. ' +
      'For react, define an `App` component using React hooks.',
    parameters: LiveGenSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'LiveGen' as const, ...args }),
  }),
};
