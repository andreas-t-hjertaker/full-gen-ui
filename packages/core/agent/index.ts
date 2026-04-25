/**
 * Multi-agent orchestration for educational mode (issue #6).
 *
 * Public surface: `orchestrateLesson` (server) and the narration helpers
 * (client). The schemas are exported so a consumer can validate inputs at
 * the network boundary.
 */

export * from './schemas';
export * from './orchestrator';
export { speak, cancelSpeech, holdSegment } from './narration';
export type { SpeakOptions } from './narration';
