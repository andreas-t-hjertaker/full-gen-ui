/**
 * AG-UI transport (issue #2).
 *
 * Server-side: `AGUIEmitter` for writing to the SSE stream and
 * `bridgeAiSdkToAGUI` for piping AI SDK results through it.
 *
 * Client-side: `useAGUI` for consuming the SSE stream in React with a flat
 * `{ spec, text, running, error, send }` API.
 */

export * from './types';
export { AGUIEmitter, newRunId, newMessageId } from './agui';
export { bridgeAiSdkToAGUI } from './aiSdkBridge';
export type { StreamPart, StreamTextLike } from './aiSdkBridge';
export { useAGUI } from './client';
export type { UseAGUIOptions, UseAGUIResult } from './client';
