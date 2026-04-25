import type { AGUIEmitter } from './agui';
import { newMessageId } from './agui';

/**
 * Bridge: consume a Vercel AI SDK `streamText` result and re-publish each
 * step as canonical AG-UI events. Token deltas become `TEXT_MESSAGE_CONTENT`,
 * tool calls become `TOOL_CALL_*` events, and the final tool *results* are
 * re-emitted as a `CUSTOM` event named `component_spec` so the browser can
 * pluck out the rendered component without re-parsing tool args.
 *
 * The "component_spec" custom event is the only place where this bridge
 * leaks domain knowledge of full-gen-ui. Everything else is generic AG-UI.
 */
/**
 * The bridge takes anything that exposes a `fullStream` of stream parts.
 * We don't import the AI SDK's `TextStreamPart<TOOLS>` type here on purpose —
 * pulling `ai` as a peer dep into a generic core package would couple our
 * transport layer to the AI SDK's exact tool-set generic shape, and we want
 * the bridge swappable. Each emitted part has at least a `type` string; we
 * narrow at runtime in the switch below.
 */
export interface StreamTextLike {
  fullStream: AsyncIterable<unknown>;
}

export type StreamPart = { type: string } & Record<string, unknown>;

export async function bridgeAiSdkToAGUI(
  result: StreamTextLike,
  emitter: AGUIEmitter,
  opts: { runId: string }
): Promise<void> {
  const { runId } = opts;
  let currentMessageId: string | null = null;

  emitter.emit({
    type: 'RUN_STARTED',
    runId,
    timestamp: Date.now(),
  });

  const ensureMessage = () => {
    if (currentMessageId) return currentMessageId;
    currentMessageId = newMessageId();
    emitter.emit({
      type: 'TEXT_MESSAGE_START',
      messageId: currentMessageId,
      role: 'assistant',
      timestamp: Date.now(),
    });
    return currentMessageId;
  };

  const closeMessage = () => {
    if (!currentMessageId) return;
    emitter.emit({
      type: 'TEXT_MESSAGE_END',
      messageId: currentMessageId,
      timestamp: Date.now(),
    });
    currentMessageId = null;
  };

  try {
    for await (const raw of result.fullStream) {
      const part = raw as StreamPart;
      switch (part.type) {
        case 'text-delta': {
          const id = ensureMessage();
          emitter.emit({
            type: 'TEXT_MESSAGE_CONTENT',
            messageId: id,
            delta: (part as unknown as { textDelta: string }).textDelta,
            timestamp: Date.now(),
          });
          break;
        }
        case 'tool-call-streaming-start': {
          closeMessage();
          const p = part as unknown as { toolCallId: string; toolName: string };
          emitter.emit({
            type: 'TOOL_CALL_START',
            toolCallId: p.toolCallId,
            toolName: p.toolName,
            timestamp: Date.now(),
          });
          break;
        }
        case 'tool-call-delta': {
          const p = part as unknown as { toolCallId: string; argsTextDelta: string };
          emitter.emit({
            type: 'TOOL_CALL_ARGS',
            toolCallId: p.toolCallId,
            delta: p.argsTextDelta,
            timestamp: Date.now(),
          });
          break;
        }
        case 'tool-call': {
          // Some providers emit only the final non-streaming call; treat it
          // as start+args+end so the client always sees the full lifecycle.
          closeMessage();
          const p = part as unknown as {
            toolCallId: string;
            toolName: string;
            args: unknown;
          };
          emitter.emit({
            type: 'TOOL_CALL_START',
            toolCallId: p.toolCallId,
            toolName: p.toolName,
            timestamp: Date.now(),
          });
          emitter.emit({
            type: 'TOOL_CALL_ARGS',
            toolCallId: p.toolCallId,
            delta: JSON.stringify(p.args),
            timestamp: Date.now(),
          });
          emitter.emit({
            type: 'TOOL_CALL_END',
            toolCallId: p.toolCallId,
            timestamp: Date.now(),
          });
          break;
        }
        case 'tool-result': {
          const p = part as unknown as {
            toolCallId: string;
            toolName: string;
            result: unknown;
          };
          emitter.emit({
            type: 'TOOL_CALL_RESULT',
            toolCallId: p.toolCallId,
            result: p.result,
            timestamp: Date.now(),
          });
          // Convenience: surface the full-gen-ui component spec via CUSTOM
          // so a render layer doesn't need to know about AI SDK tool semantics.
          if (
            p.result &&
            typeof p.result === 'object' &&
            'component' in (p.result as Record<string, unknown>)
          ) {
            emitter.emit({
              type: 'CUSTOM',
              name: 'component_spec',
              payload: p.result,
              timestamp: Date.now(),
            });
          }
          break;
        }
        case 'error': {
          const err = (part as unknown as { error: unknown }).error;
          const message = err instanceof Error ? err.message : String(err);
          emitter.error(runId, message);
          return;
        }
        case 'finish':
          // Loop will exit on its own; finalize after closing message.
          break;
        default:
          // Unknown — relay as CUSTOM so debugging UIs can still see it.
          emitter.emit({
            type: 'CUSTOM',
            name: `ai_sdk_${part.type}`,
            payload: part as unknown,
            timestamp: Date.now(),
          });
      }
    }
    closeMessage();
    emitter.finish(runId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    emitter.error(runId, message);
  }
}
