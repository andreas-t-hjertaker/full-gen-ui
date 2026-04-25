'use client';

import { useEffect, useRef, useState } from 'react';
import type { AGUIEvent } from './types';

export interface UseAGUIOptions {
  endpoint: string;
  onEvent?: (event: AGUIEvent) => void;
}

export interface UseAGUIResult {
  /** Send a user message; events stream back via onEvent and the spec/text accumulators below. */
  send: (text: string) => Promise<void>;
  /** Most recent component_spec CUSTOM event payload — what the renderer should display. */
  spec: unknown | null;
  /** Concatenated assistant text (TEXT_MESSAGE_CONTENT deltas across the run). */
  text: string;
  /** True while a run is in flight. */
  running: boolean;
  /** Last emitted RUN_ERROR message, if any. */
  error: string | null;
}

/**
 * Browser-side AG-UI client. Doesn't depend on `@ag-ui/client` because that
 * package's hooks pull in its own state machine assumptions; we want a flat
 * "current spec / current text" API that maps cleanly onto our renderer.
 */
export function useAGUI(opts: UseAGUIOptions): UseAGUIResult {
  const [spec, setSpec] = useState<unknown | null>(null);
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  async function send(content: string) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setSpec(null);
    setText('');
    setError(null);
    setRunning(true);

    try {
      const res = await fetch(opts.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
        }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          for (const line of frame.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6);
            try {
              const event = JSON.parse(json) as AGUIEvent;
              onEventRef.current?.(event);
              applyEvent(event, { setSpec, setText, setError });
            } catch {
              // ignore malformed frame
            }
          }
        }
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  return { send, spec, text, running, error };
}

function applyEvent(
  event: AGUIEvent,
  setters: {
    setSpec: (s: unknown) => void;
    setText: (fn: (prev: string) => string) => void;
    setError: (s: string | null) => void;
  }
) {
  switch (event.type) {
    case 'TEXT_MESSAGE_CONTENT':
      setters.setText((prev) => prev + event.delta);
      break;
    case 'CUSTOM':
      if (event.name === 'component_spec') {
        setters.setSpec(event.payload);
      }
      break;
    case 'RUN_ERROR':
      setters.setError(event.message);
      break;
    default:
    // ignore — tool args/results aren't directly user-visible
  }
}
