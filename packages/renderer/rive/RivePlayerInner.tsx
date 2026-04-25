'use client';

import { useEffect, useMemo } from 'react';
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import type { RiveAnimationSpec } from './schemas';

const FIT_MAP: Record<NonNullable<RiveAnimationSpec['fit']>, Fit> = {
  contain: Fit.Contain,
  cover: Fit.Cover,
  fill: Fit.Fill,
  fitWidth: Fit.FitWidth,
  fitHeight: Fit.FitHeight,
  none: Fit.None,
};

export default function RivePlayerInner({ spec }: { spec: RiveAnimationSpec }) {
  const layout = useMemo(
    () =>
      new Layout({
        fit: FIT_MAP[spec.fit ?? 'contain'],
        alignment: Alignment.Center,
      }),
    [spec.fit]
  );

  const { rive, RiveComponent } = useRive({
    src: spec.url,
    artboard: spec.artboard,
    stateMachines: spec.stateMachine,
    autoplay: true,
    layout,
  });

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: spec.background ?? 'transparent' }}
    >
      {spec.label && (
        <div className="absolute top-6 text-sm uppercase tracking-[0.25em] text-white/60">
          {spec.label}
        </div>
      )}
      <RiveComponent className="w-full h-full" />
      <InputBridge rive={rive} stateMachine={spec.stateMachine} inputs={spec.inputs} />
    </div>
  );
}

/**
 * Pushes the LLM-supplied input map into the running state machine. Numbers
 * → Number inputs, booleans → Bool inputs, "trigger" string → fire().
 */
function InputBridge({
  rive,
  stateMachine,
  inputs,
}: {
  rive: ReturnType<typeof useRive>['rive'];
  stateMachine: string;
  inputs: RiveAnimationSpec['inputs'];
}) {
  // We need stable hooks per input — derive a stable, sorted key list once.
  const keys = useMemo(
    () => (inputs ? Object.keys(inputs).sort() : []),
    [inputs]
  );

  return (
    <>
      {keys.map((name) => (
        <RiveInputDriver
          key={name}
          rive={rive}
          stateMachine={stateMachine}
          name={name}
          value={inputs?.[name]}
        />
      ))}
    </>
  );
}

function RiveInputDriver({
  rive,
  stateMachine,
  name,
  value,
}: {
  rive: ReturnType<typeof useRive>['rive'];
  stateMachine: string;
  name: string;
  value: boolean | number | 'trigger' | undefined;
}) {
  const input = useStateMachineInput(rive, stateMachine, name);
  useEffect(() => {
    if (!input) return;
    if (value === 'trigger') {
      input.fire();
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      input.value = value;
    }
  }, [input, value]);
  return null;
}
