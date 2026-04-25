/**
 * AG-UI protocol event types.
 *
 * This is a pragmatic re-implementation of the public AG-UI v0.1 event
 * surface — the protocol that lets an agent push UI events to the browser
 * over Server-Sent Events without round-tripping through user input. We
 * keep the wire format identical (`{ type, ... }` JSON over `text/event-stream`)
 * so a `@ag-ui/client` consumer can subscribe to our endpoint, and so we can
 * later swap our emitter for `@ag-ui/server` without changing the wire.
 *
 * See: https://docs.ag-ui.com/concepts/events
 */

export type RunStartedEvent = {
  type: 'RUN_STARTED';
  runId: string;
  threadId?: string;
  timestamp: number;
};

export type RunFinishedEvent = {
  type: 'RUN_FINISHED';
  runId: string;
  timestamp: number;
};

export type RunErrorEvent = {
  type: 'RUN_ERROR';
  runId: string;
  message: string;
  timestamp: number;
};

export type TextMessageStartEvent = {
  type: 'TEXT_MESSAGE_START';
  messageId: string;
  role: 'assistant';
  timestamp: number;
};

export type TextMessageContentEvent = {
  type: 'TEXT_MESSAGE_CONTENT';
  messageId: string;
  delta: string;
  timestamp: number;
};

export type TextMessageEndEvent = {
  type: 'TEXT_MESSAGE_END';
  messageId: string;
  timestamp: number;
};

export type ToolCallStartEvent = {
  type: 'TOOL_CALL_START';
  toolCallId: string;
  toolName: string;
  parentMessageId?: string;
  timestamp: number;
};

export type ToolCallArgsEvent = {
  type: 'TOOL_CALL_ARGS';
  toolCallId: string;
  delta: string;
  timestamp: number;
};

export type ToolCallEndEvent = {
  type: 'TOOL_CALL_END';
  toolCallId: string;
  timestamp: number;
};

export type ToolCallResultEvent = {
  type: 'TOOL_CALL_RESULT';
  toolCallId: string;
  result: unknown;
  timestamp: number;
};

export type StateSnapshotEvent = {
  type: 'STATE_SNAPSHOT';
  state: unknown;
  timestamp: number;
};

export type StateDeltaEvent = {
  type: 'STATE_DELTA';
  // JSON Patch (RFC 6902) operations
  patch: Array<{ op: string; path: string; value?: unknown }>;
  timestamp: number;
};

export type CustomEvent = {
  type: 'CUSTOM';
  name: string;
  payload: unknown;
  timestamp: number;
};

export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | StateSnapshotEvent
  | StateDeltaEvent
  | CustomEvent;

export interface AGUIRunInput {
  threadId?: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  // Optional initial state the agent can mutate via STATE_DELTA
  state?: unknown;
}
