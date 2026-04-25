'use client';

import { useMemo } from 'react';
import { z } from 'zod';

/**
 * Auto-generated form for a Zod schema.
 *
 * Why hand-rolled instead of `react-hook-form` + `@hookform/resolvers/zod`?
 * The introspection patterns are small and our schemas use a known subset of
 * Zod features (number, string, boolean, enum, array of objects, tuple). A
 * 200-line walker is far less code than the equivalent dynamic field-array
 * config for RHF, and it gives us instant validation feedback by re-parsing
 * the value on every keystroke.
 */
export function SchemaForm<S extends z.ZodTypeAny>({
  schema,
  value,
  onChange,
}: {
  schema: S;
  value: z.infer<S>;
  onChange: (next: z.infer<S>) => void;
}) {
  const errors = useMemo(() => {
    const r = schema.safeParse(value);
    return r.success ? null : r.error.issues;
  }, [schema, value]);

  return (
    <div className="flex flex-col gap-3">
      <FieldRenderer
        schema={schema}
        value={value}
        path={[]}
        onChange={(v) => onChange(v as z.infer<S>)}
      />
      {errors && errors.length > 0 && (
        <div className="mt-2 rounded-lg bg-red-900/40 border border-red-500/30 p-2 text-xs text-red-200">
          <div className="font-semibold mb-1">Validation</div>
          {errors.slice(0, 5).map((e, i) => (
            <div key={i} className="font-mono">
              {e.path.join('.') || '(root)'}: {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Walker ─────────────────────────────────────────────────────────────

function unwrap(s: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  let inner = s;
  let optional = false;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    optional = true;
    inner = inner._def.innerType as z.ZodTypeAny;
  }
  return { inner, optional };
}

function describe(s: z.ZodTypeAny): string | undefined {
  return s.description;
}

interface FieldProps {
  schema: z.ZodTypeAny;
  value: unknown;
  path: Array<string | number>;
  onChange: (v: unknown) => void;
}

function FieldRenderer({ schema, value, path, onChange }: FieldProps) {
  const { inner } = unwrap(schema);

  if (inner instanceof z.ZodObject) {
    const shape = inner.shape as Record<string, z.ZodTypeAny>;
    return (
      <>
        {Object.entries(shape).map(([key, child]) => {
          if (child instanceof z.ZodLiteral) return null; // discriminator
          const v = (value as Record<string, unknown>)?.[key];
          return (
            <FormRow key={key} label={key} hint={describe(child)}>
              <FieldRenderer
                schema={child}
                value={v}
                path={[...path, key]}
                onChange={(nv) =>
                  onChange({ ...(value as object), [key]: nv })
                }
              />
            </FormRow>
          );
        })}
      </>
    );
  }

  if (inner instanceof z.ZodEnum) {
    const opts = inner._def.values as string[];
    return (
      <select
        value={String(value ?? opts[0])}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm w-full"
      >
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (inner instanceof z.ZodNumber) {
    return (
      <input
        type="number"
        value={value === undefined ? '' : (value as number)}
        onChange={(e) =>
          onChange(e.target.value === '' ? undefined : Number(e.target.value))
        }
        className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm w-full font-mono"
      />
    );
  }

  if (inner instanceof z.ZodBoolean) {
    return (
      <label className="inline-flex items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-amber-400"
        />
        <span className="text-xs text-white/40">{value ? 'true' : 'false'}</span>
      </label>
    );
  }

  if (inner instanceof z.ZodString) {
    const long = (value as string)?.length > 60;
    if (long) {
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm w-full font-mono"
        />
      );
    }
    return (
      <input
        type="text"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm w-full"
      />
    );
  }

  if (inner instanceof z.ZodTuple) {
    const items = inner._def.items as z.ZodTypeAny[];
    const arr = (value as unknown[]) ?? items.map(() => undefined);
    return (
      <div className="flex gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex-1">
            <FieldRenderer
              schema={item}
              value={arr[i]}
              path={[...path, i]}
              onChange={(nv) => {
                const next = arr.slice();
                next[i] = nv;
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (inner instanceof z.ZodArray) {
    const itemSchema = inner._def.type as z.ZodTypeAny;
    const arr = (value as unknown[]) ?? [];
    return (
      <div className="flex flex-col gap-2">
        {arr.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-2 relative"
          >
            <button
              type="button"
              aria-label={`Remove item ${i + 1}`}
              onClick={() => {
                const next = arr.slice();
                next.splice(i, 1);
                onChange(next);
              }}
              className="absolute top-1.5 right-1.5 text-white/30 hover:text-red-400 text-xs"
            >
              ×
            </button>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">
              [{i}]
            </div>
            <FieldRenderer
              schema={itemSchema}
              value={item}
              path={[...path, i]}
              onChange={(nv) => {
                const next = arr.slice();
                next[i] = nv;
                onChange(next);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const next = arr.slice();
            next.push(makeDefault(itemSchema));
            onChange(next);
          }}
          className="text-xs uppercase tracking-widest text-white/40 hover:text-white border border-dashed border-white/10 rounded-lg py-1.5"
        >
          + add item
        </button>
      </div>
    );
  }

  if (inner instanceof z.ZodUnion) {
    // Render JSON for unions to avoid combinatorial UI complexity.
    return <JsonField value={value} onChange={onChange} />;
  }

  if (inner instanceof z.ZodRecord) {
    return <JsonField value={value} onChange={onChange} />;
  }

  // Fallback — JSON edit
  return <JsonField value={value} onChange={onChange} />;
}

function JsonField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <textarea
      value={JSON.stringify(value, null, 2)}
      onChange={(e) => {
        try {
          onChange(JSON.parse(e.target.value));
        } catch {
          // leave value alone until JSON is valid
        }
      }}
      rows={4}
      className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs w-full font-mono"
    />
  );
}

function FormRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-widest text-white/50">
          {label}
        </span>
        {hint && <span className="text-[11px] text-white/30">{hint}</span>}
      </div>
      <div>{children}</div>
    </label>
  );
}

function makeDefault(schema: z.ZodTypeAny): unknown {
  const { inner } = unwrap(schema);
  if (inner instanceof z.ZodString) return '';
  if (inner instanceof z.ZodNumber) return 0;
  if (inner instanceof z.ZodBoolean) return false;
  if (inner instanceof z.ZodEnum) return inner._def.values[0];
  if (inner instanceof z.ZodArray) return [];
  if (inner instanceof z.ZodTuple)
    return (inner._def.items as z.ZodTypeAny[]).map(() => undefined);
  if (inner instanceof z.ZodObject) {
    const shape = inner.shape as Record<string, z.ZodTypeAny>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(shape)) {
      if (v instanceof z.ZodLiteral) {
        out[k] = v._def.value;
      } else if (!unwrap(v).optional) {
        out[k] = makeDefault(v);
      }
    }
    return out;
  }
  return undefined;
}
