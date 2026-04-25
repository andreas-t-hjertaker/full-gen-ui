import { tool } from 'ai';
import {
  ParticleFieldSchema,
  WaveformSchema,
  ConceptDiagramSchema,
  CounterSchema,
  TextRevealSchema,
  LiveGenSchema,
  StepThroughSchema,
  FunctionPlotSchema,
  SortingVisualizerSchema,
  PhysicsSceneSchema,
  TimelineEventSchema,
  CodeWalkthroughSchema,
  RiveAnimationSchema,
} from './schemas';

/**
 * Single source of truth for the LLM tool surface.
 * Every tool's parameter schema is the same Zod schema the renderer expects,
 * minus the `component` discriminator (which the tool result re-attaches).
 */
export const genUITools = {
  // ─── Pre-built canvas/GPU components ────────────────────────────────────
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

  // ─── Educational catalog (issue #4) ─────────────────────────────────────
  renderStepThrough: tool({
    description:
      'Animated step-by-step explanation, like a slide deck that auto-advances. ' +
      'Best for procedural concepts: how a chemical reaction proceeds, the lifecycle of a request, the steps of long division.',
    parameters: StepThroughSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'StepThrough' as const, ...args }),
  }),

  renderFunctionPlot: tool({
    description:
      'Plot a math function y = f(x) with an animated trace. ' +
      'Best for math/physics explanations: derivatives, periodic functions, decay curves, polynomials. ' +
      'Allowed expression syntax: + - * / **  ( ), and functions sin/cos/tan/exp/log/sqrt/abs/pow. ' +
      'Reference x as the variable.',
    parameters: FunctionPlotSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'FunctionPlot' as const, ...args }),
  }),

  renderSortingVisualizer: tool({
    description:
      'Animate a classical sorting algorithm — bubble, insertion, selection, merge or quick sort — operating on a randomized array. ' +
      'Best when explaining algorithmic complexity, swaps and comparisons.',
    parameters: SortingVisualizerSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'SortingVisualizer' as const, ...args }),
  }),

  renderPhysicsScene: tool({
    description:
      'Show a small physics simulation. ' +
      'Presets: gravity (falling balls), pendulum (single pendulum), wave (traveling sine wave), ' +
      'collisions (elastic balls), orbit (planets around a star). ' +
      'Use for physics, motion, energy, oscillation, gravitation explanations.',
    parameters: PhysicsSceneSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'PhysicsScene' as const, ...args }),
  }),

  renderTimelineEvent: tool({
    description:
      'Animated timeline of historical, scientific, or product events. ' +
      'Each event has a year, title, and short body. Use for history, evolution, milestones.',
    parameters: TimelineEventSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'TimelineEvent' as const, ...args }),
  }),

  renderCodeWalkthrough: tool({
    description:
      'Reveal a code snippet step-by-step with explanations beside each highlighted block. ' +
      'Best for programming explanations, algorithm walkthroughs, library demos.',
    parameters: CodeWalkthroughSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'CodeWalkthrough' as const, ...args }),
  }),

  // ─── Rive (issue #5) ────────────────────────────────────────────────────
  renderRiveAnimation: tool({
    description:
      'Drive a Rive state machine — for interactive characters, brand mascots, or 120fps GPU UI. ' +
      'Use the bundled demo file at /rive/demo.riv with state machine "Main" unless you have a specific public .riv URL. ' +
      'Pass an inputs map: numbers map to Number inputs, booleans to Bool inputs, the string "trigger" pulses a Trigger input.',
    parameters: RiveAnimationSchema.omit({ component: true }),
    execute: async (args) => ({ component: 'RiveAnimation' as const, ...args }),
  }),

  // ─── Live-gen (existing) ────────────────────────────────────────────────
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
