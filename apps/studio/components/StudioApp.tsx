'use client';

import { useMemo, useState } from 'react';
import { CATALOG } from '@/lib/registry';
import { SchemaForm } from './SchemaForm';
import { Preview } from './Preview';

type Variant = {
  id: string;
  label: string;
  spec: Record<string, unknown>;
};

/**
 * Studio shell: a three-pane layout — catalog list on the left, parameter
 * form in the middle, and a live preview on the right. The preview re-mounts
 * on every spec change so animations restart from t=0 (which is what you
 * want when iterating).
 */
export function StudioApp() {
  const [activeId, setActiveId] = useState(CATALOG[0].id);
  const active = CATALOG.find((e) => e.id === activeId)!;

  // Per-component working spec map keeps each tab's edits independent.
  const [working, setWorking] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const c of CATALOG) init[c.id] = c.initialValue;
    return init;
  });
  const spec = working[active.id] as { component: string } & Record<string, unknown>;

  // Validate the working spec against the active schema; surface as a banner.
  const errorMsg = useMemo(() => {
    const r = active.schema.safeParse(spec);
    if (r.success) return null;
    return r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ');
  }, [active.schema, spec]);

  // Variants per component
  const [variants, setVariants] = useState<Record<string, Variant[]>>({});
  const myVariants = variants[active.id] ?? [];

  // LLM panel state
  const [llmPrompt, setLlmPrompt] = useState('');
  const [llmRunning, setLlmRunning] = useState(false);
  const [llmResult, setLlmResult] = useState<{
    chosen: string;
    spec: Record<string, unknown>;
  } | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  function update(next: unknown) {
    setWorking((s) => ({ ...s, [active.id]: next as Record<string, unknown> }));
  }

  function saveVariant() {
    const id = `${active.id}-${Date.now().toString(36)}`;
    const v: Variant = {
      id,
      label: `${active.label} variant ${myVariants.length + 1}`,
      spec: structuredClone(spec),
    };
    setVariants((s) => ({ ...s, [active.id]: [...(s[active.id] ?? []), v] }));
  }

  function loadVariant(v: Variant) {
    setWorking((s) => ({ ...s, [active.id]: v.spec }));
  }

  async function runLlm() {
    setLlmRunning(true);
    setLlmError(null);
    setLlmResult(null);
    try {
      const res = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: llmPrompt }),
      });
      const json = (await res.json()) as
        | { chosen: string; spec: Record<string, unknown> }
        | { error: string };
      if ('error' in json) {
        setLlmError(json.error);
      } else {
        setLlmResult(json);
      }
    } catch (e) {
      setLlmError(e instanceof Error ? e.message : String(e));
    } finally {
      setLlmRunning(false);
    }
  }

  function adoptLlmResult() {
    if (!llmResult) return;
    const target = CATALOG.find((c) => c.id === llmResult.chosen);
    if (!target) return;
    setActiveId(target.id);
    setWorking((s) => ({ ...s, [target.id]: llmResult.spec }));
  }

  return (
    <div className="grid grid-cols-[260px_360px_1fr] h-screen text-sm">
      {/* ─── Catalog sidebar ───────────────────────────────────────── */}
      <aside className="border-r border-white/5 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="text-xs uppercase tracking-[0.25em] text-white/40">
          Catalog
        </div>
        <ul className="flex flex-col gap-1">
          {CATALOG.map((entry) => (
            <li key={entry.id}>
              <button
                onClick={() => setActiveId(entry.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  active.id === entry.id
                    ? 'bg-amber-400/10 text-amber-200'
                    : 'hover:bg-white/5 text-white/70'
                }`}
              >
                <div className="font-medium">{entry.label}</div>
                <div className="text-[11px] text-white/40 line-clamp-2">
                  {entry.description}
                </div>
              </button>
            </li>
          ))}
        </ul>

        {myVariants.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
              Variants
            </div>
            <ul className="flex flex-col gap-1">
              {myVariants.map((v) => (
                <li key={v.id}>
                  <button
                    onClick={() => loadVariant(v)}
                    className="w-full text-left px-3 py-2 rounded-md bg-white/[0.03] hover:bg-white/10 text-white/70 text-xs"
                  >
                    {v.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* ─── Editor middle pane ────────────────────────────────────── */}
      <section className="border-r border-white/5 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold flex-1">{active.label}</h2>
          <button
            type="button"
            onClick={saveVariant}
            className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-white/5 hover:bg-white/10"
          >
            save variant
          </button>
        </div>
        <SchemaForm
          schema={active.schema}
          value={spec}
          onChange={update}
        />

        <details className="mt-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-white/40">
            JSON spec (export)
          </summary>
          <pre className="mt-2 bg-white/[0.03] border border-white/5 rounded-lg p-3 text-[11px] font-mono whitespace-pre-wrap break-all overflow-x-auto">
            {JSON.stringify(spec, null, 2)}
          </pre>
          <CopyButton text={JSON.stringify(spec, null, 2)} />
        </details>

        <details className="mt-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-white/40">
            Test with LLM
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="text"
              value={llmPrompt}
              onChange={(e) => setLlmPrompt(e.target.value)}
              placeholder="Send a prompt — see which catalog entry the LLM picks"
              className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={runLlm}
              disabled={llmRunning || !llmPrompt.trim()}
              className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded bg-amber-400 text-black font-semibold disabled:opacity-30"
            >
              {llmRunning ? 'thinking…' : 'send'}
            </button>
            {llmError && (
              <div className="text-xs text-red-300 font-mono">{llmError}</div>
            )}
            {llmResult && (
              <div className="border border-white/5 rounded-lg p-2 bg-white/[0.03] text-xs">
                <div className="text-white/60">
                  LLM chose: <strong>{llmResult.chosen}</strong>
                </div>
                <button
                  type="button"
                  onClick={adoptLlmResult}
                  className="mt-2 text-[11px] uppercase tracking-widest px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  load into editor
                </button>
              </div>
            )}
          </div>
        </details>
      </section>

      {/* ─── Preview ───────────────────────────────────────────────── */}
      <main className="relative">
        <Preview spec={spec} error={errorMsg} />
      </main>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="mt-2 text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-white/5 hover:bg-white/10"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // ignore
        }
      }}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}
