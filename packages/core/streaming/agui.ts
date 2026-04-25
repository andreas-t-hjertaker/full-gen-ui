import type { AGUIEvent } from './types';

/**
 * Minimal AG-UI emitter. Wraps a `ReadableStream` so a route handler can
 * `return new Response(emitter.stream, { headers: emitter.headers })` and the
 * browser receives a valid SSE stream of AG-UI events.
 *
 * Why not depend on `@ag-ui/server` directly?
 *   - `@ag-ui/*` is moving fast and pre-1.0; pinning to its exact API in our
 *     core package would couple our framework choice to a single vendor SDK.
 *   - The wire format is small enough that owning it directly is cheaper than
 *     the indirection cost of the dep, and it lets us add custom events
 *     (`CUSTOM` of name "component_spec") without lobbying upstream.
 */
export class AGUIEmitter {
  private readonly encoder = new TextEncoder();
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  readonly stream: ReadableStream<Uint8Array>;
  private closed = false;

  constructor() {
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.closed = true;
      },
    });
  }

  /**
   * Headers to use on the SSE response. `text/event-stream` triggers the
   * browser EventSource path; the no-cache + keep-alive combo prevents
   * intermediaries from buffering events.
   */
  get headers(): HeadersInit {
    return {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    };
  }

  emit(event: AGUIEvent): void {
    if (this.closed) return;
    const line = `data: ${JSON.stringify(event)}\n\n`;
    try {
      this.controller.enqueue(this.encoder.encode(line));
    } catch {
      this.closed = true;
    }
  }

  /** Single point that emits `RUN_FINISHED` and closes the stream. */
  finish(runId: string): void {
    this.emit({ type: 'RUN_FINISHED', runId, timestamp: Date.now() });
    this.close();
  }

  /** Emit `RUN_ERROR` and close. */
  error(runId: string, message: string): void {
    this.emit({
      type: 'RUN_ERROR',
      runId,
      message,
      timestamp: Date.now(),
    });
    this.close();
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    try {
      this.controller.close();
    } catch {
      // already closed
    }
  }
}

/**
 * Generates an opaque, stable-ish run id. Not security-sensitive — the
 * frontend uses it to disambiguate concurrent runs in dev tools, that's all.
 */
export function newRunId(): string {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function newMessageId(): string {
  return `msg_${Math.random().toString(36).slice(2, 12)}`;
}
