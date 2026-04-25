import { z } from 'zod';

/**
 * Rive renderer spec.
 *
 * The LLM provides a `.riv` URL plus a state-machine name and the inputs to
 * drive. Inputs may be booleans (`fire`, `idle`), numbers (`progress`,
 * `mood`), or trigger pulses. The component pushes them into the running
 * state machine without re-mounting.
 *
 * For the MVP demo we ship one bundled `.riv` file; the schema is open so the
 * model can target any hosted Rive file by URL.
 */

export const RiveInputValueSchema = z.union([
  z.boolean(),
  z.number(),
  z.literal('trigger'),
]);

export const RiveAnimationSchema = z.object({
  component: z.literal('RiveAnimation'),
  url: z
    .string()
    .describe(
      'Public URL to a .riv file. Use the bundled demo asset "/rive/demo.riv" ' +
        'unless instructed otherwise.'
    ),
  artboard: z
    .string()
    .optional()
    .describe('Artboard name (defaults to the file default)'),
  stateMachine: z.string().describe('State machine to drive, e.g. "Main"'),
  inputs: z
    .record(RiveInputValueSchema)
    .optional()
    .describe(
      'Map of input name → value. Numbers map to Number inputs, booleans to ' +
        'Bool inputs, the literal string "trigger" pulses a Trigger input.'
    ),
  background: z.string().optional().describe('Background color hex'),
  fit: z
    .enum(['contain', 'cover', 'fill', 'fitWidth', 'fitHeight', 'none'])
    .optional(),
  label: z.string().optional(),
});

export type RiveAnimationSpec = z.infer<typeof RiveAnimationSchema>;
export type RiveInputValue = z.infer<typeof RiveInputValueSchema>;
