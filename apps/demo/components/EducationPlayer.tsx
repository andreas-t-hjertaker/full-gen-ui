'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GenUIRenderer } from './GenUIRenderer';
import type { ComponentSpec } from '@/lib/schemas';
import type { CurriculumEntry } from '@fgu/core/agent';
import { speak, cancelSpeech, holdSegment } from '@fgu/core/agent';

/**
 * The educational mode player (issue #6).
 *
 * - Streams `curriculum_entry` AG-UI events from `/api/educate`.
 * - As each entry arrives, queues it. The playback loop picks the next
 *   entry, swaps the rendered component, fires the narration, and waits
 *   for the longer of `holdSeconds` and the narration's natural duration.
 * - Skipping or interrupting cancels the current utterance via
 *   `cancelSpeech()` so the next segment isn't talked over.
 */
export function EducationPlayer() {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<CurriculumEntry[]>([]);
  const [active, setActive] = useState<CurriculumEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playingRef = useRef(false);
  const nextIndexRef = useRef(0);
  // Mirror queue into a ref so the playback loop reads live data instead of
  // its closure-captured snapshot. Without this, segments that arrive while
  // the loop is mid-iteration are silently skipped.
  const queueRef = useRef<CurriculumEntry[]>([]);
  queueRef.current = queue;

  const start = useCallback(async (text: string) => {
    setError(null);
    setQueue([]);
    setActive(null);
    nextIndexRef.current = 0;
    setRunning(true);
    cancelSpeech();

    try {
      const res = await fetch('/api/educate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
        },
        body: JSON.stringify({ prompt: text }),
      });
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          for (const line of frame.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.type === 'CUSTOM' && ev.name === 'curriculum_entry') {
                setQueue((q) => [...q, ev.payload as CurriculumEntry]);
              } else if (ev.type === 'RUN_ERROR') {
                setError(String(ev.message));
              }
            } catch {
              /* malformed frame */
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  // Playback loop — runs whenever the queue grows or the previous segment
  // finishes. Uses a ref-flag so re-renders don't double-start it. The body
  // reads `queueRef.current` (live) rather than the captured `queue`, so
  // entries that arrive after the loop started are still picked up.
  useEffect(() => {
    if (playingRef.current) return;
    if (nextIndexRef.current >= queueRef.current.length) return;
    playingRef.current = true;
    void (async () => {
      try {
        while (nextIndexRef.current < queueRef.current.length) {
          const entry = queueRef.current[nextIndexRef.current];
          setActive(entry);
          const narrationP = speak({
            text: entry.narration,
            lang: 'en-US',
          });
          await holdSegment(narrationP, entry.holdSeconds);
          nextIndexRef.current++;
        }
      } finally {
        playingRef.current = false;
      }
    })();
  }, [queue]);

  useEffect(() => () => cancelSpeech(), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || running) return;
    start(prompt.trim());
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 relative overflow-hidden bg-black">
        {!active && !running && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/30">
            <div className="text-5xl font-thin tracking-widest">educate</div>
            <div className="text-xs uppercase tracking-[0.3em]">
              Ask anything to learn — the lesson appears, animated and narrated.
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-900/40 text-red-200 text-xs rounded-lg font-mono">
            {error}
          </div>
        )}

        {active && (
          <>
            <GenUIRenderer
              key={active.index}
              spec={active.componentSpec as ComponentSpec}
            />
            <div className="absolute top-6 left-6 right-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/50">
              <div>
                Segment {active.index + 1}/{queue.length || '?'}
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="truncate max-w-[60%]">{active.title}</div>
            </div>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl px-6 text-center text-white/85 text-base leading-relaxed pointer-events-none">
              {active.narration}
            </div>
          </>
        )}

        {running && !active && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5 text-white/40 text-xs uppercase tracking-widest">
            preparing lesson…
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="border-t border-white/10 bg-black/80 backdrop-blur-sm p-4 flex gap-3 items-center"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={running}
          placeholder="Teach me about… (e.g. quicksort, electromagnetism, the French Revolution)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-white/30 text-sm disabled:opacity-40"
          autoFocus
        />
        <button
          type="submit"
          disabled={running || !prompt.trim()}
          className="px-5 py-3 bg-white text-black text-sm font-semibold rounded-xl disabled:opacity-30 hover:bg-white/90 transition-colors"
        >
          {running ? '…' : 'Teach'}
        </button>
      </form>
    </main>
  );
}
