# `@fgu/core/streaming` — AG-UI transport

Closes issue #2.

This package implements the AG-UI v0.1 event protocol (the bidirectional
SSE protocol from CopilotKit) on top of Vercel AI SDK. It does **not**
replace `useChat` — both transports run side-by-side and apps can pick the
one that fits.

## Why we don't depend on `@ag-ui/server` directly

`@ag-ui/*` is pre-1.0 and its API surface is still moving. We keep the
wire format compatible (the same `text/event-stream` of `{ type, ... }`
JSON frames) but own the emitter and the AI SDK bridge ourselves. The
moment `@ag-ui/server` stabilizes we swap the emitter implementation in
one file with no client-side change.

## Architecture

```
┌──────────────────────────┐
│  POST /api/agui          │
│  → AGUIEmitter           │
│  → bridgeAiSdkToAGUI(    │
│       streamText(...)    │
│    )                     │
└────────────┬─────────────┘
             │  text/event-stream
             ▼
┌──────────────────────────┐
│  useAGUI(...)            │
│  → setSpec / setText     │
│  → renders via           │
│    GenUIRenderer         │
└──────────────────────────┘
```

The bridge maps AI SDK stream parts to canonical AG-UI events:

| AI SDK part                  | AG-UI event             |
| ---------------------------- | ----------------------- |
| `text-delta`                 | `TEXT_MESSAGE_CONTENT`  |
| `tool-call-streaming-start`  | `TOOL_CALL_START`       |
| `tool-call-delta`            | `TOOL_CALL_ARGS`        |
| `tool-call`                  | `TOOL_CALL_*` (synthesized lifecycle) |
| `tool-result`                | `TOOL_CALL_RESULT` + `CUSTOM("component_spec")` |
| `error`                      | `RUN_ERROR`             |

The `CUSTOM` event named `"component_spec"` is the only domain-specific
event — it carries the full `ComponentSpec` so the renderer doesn't need
to know about AI SDK tool semantics.

## Usage (server)

```ts
// app/api/agui/route.ts
import { AGUIEmitter, bridgeAiSdkToAGUI, newRunId } from '@fgu/core/streaming';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const emitter = new AGUIEmitter();
  const runId = newRunId();

  (async () => {
    const result = streamText({ model, messages, tools, maxSteps: 3 });
    await bridgeAiSdkToAGUI(result, emitter, { runId });
  })();

  return new Response(emitter.stream, { headers: emitter.headers });
}
```

## Usage (client)

```tsx
'use client';
import { useAGUI } from '@fgu/core/streaming';

export function Chat() {
  const { send, spec, text, running, error } = useAGUI({ endpoint: '/api/agui' });

  return (
    <>
      {spec && <GenUIRenderer spec={spec as ComponentSpec} />}
      <button onClick={() => send('Show me sin(x)·x')}>ask</button>
    </>
  );
}
```

## Bidirectional handshake (frontend → agent)

Frontend tool calls (UI buttons that ask the agent to act) are not yet
wired in this MVP — the SSE stream is server→client only. The next step is
to add a long-poll companion endpoint or a WebSocket upgrade for the
client→server channel, at which point `STATE_DELTA` events become
round-trippable.
