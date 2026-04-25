import { z } from 'zod';

/**
 * Inter-agent contracts. These are the only data shapes that cross agent
 * boundaries — keeps each call independently testable and the surface area
 * tight when we eventually swap one of them for a fine-tuned model.
 */

export const OrchestratorDecisionSchema = z.object({
  isLesson: z
    .boolean()
    .describe('True if the user wants an explanation / lesson, false for ambient/lookup.'),
  domain: z.enum(['math', 'physics', 'biology', 'history', 'programming', 'general']),
  segmentCount: z.number().int().min(1).max(6),
  depth: z.enum(['intuitive', 'intermediate', 'rigorous']),
  language: z
    .string()
    .describe('IETF language tag for narration, e.g. "en-US", "nb-NO"')
    .optional(),
});
export type OrchestratorDecision = z.infer<typeof OrchestratorDecisionSchema>;

export const LessonSegmentSchema = z.object({
  title: z.string().describe('Short headline for the segment (3–6 words)'),
  body: z
    .string()
    .describe('1–2 sentences of teaching content the visual will illustrate'),
  concept: z
    .string()
    .describe(
      'A concrete, animatable nugget — a specific function, a specific event, ' +
        'a specific step. Used by the Visual Agent to pick parameters.'
    ),
  approxSeconds: z
    .number()
    .min(6)
    .max(45)
    .describe('Roughly how long the segment should hold on screen.'),
});
export type LessonSegment = z.infer<typeof LessonSegmentSchema>;

export const LessonPlanSchema = z.object({
  topic: z.string(),
  segments: z.array(LessonSegmentSchema).min(1).max(6),
});
export type LessonPlan = z.infer<typeof LessonPlanSchema>;

/**
 * Final, fully-rendered curriculum that the player consumes. Each entry
 * pairs a renderable component spec with its narration text and a duration
 * the player should hold the visual for.
 */
export const CurriculumEntrySchema = z.object({
  index: z.number().int().min(0),
  title: z.string(),
  narration: z.string(),
  // We use unknown here because the Visual Agent emits any component spec
  // type from the catalog. The renderer revalidates on receive.
  componentSpec: z.unknown(),
  holdSeconds: z.number().min(2).max(60),
});
export type CurriculumEntry = z.infer<typeof CurriculumEntrySchema>;

export const CurriculumSchema = z.object({
  topic: z.string(),
  language: z.string().optional(),
  entries: z.array(CurriculumEntrySchema),
});
export type Curriculum = z.infer<typeof CurriculumSchema>;
