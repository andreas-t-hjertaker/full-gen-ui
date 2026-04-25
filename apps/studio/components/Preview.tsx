'use client';

import { Component, lazy, Suspense, type ReactNode } from 'react';
import type {
  StepThroughSpec,
  FunctionPlotSpec,
  SortingVisualizerSpec,
  PhysicsSceneSpec,
  TimelineEventSpec,
  CodeWalkthroughSpec,
} from '@fgu/catalog/educational';

const StepThrough = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.StepThrough }))
);
const FunctionPlot = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.FunctionPlot }))
);
const SortingVisualizer = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.SortingVisualizer }))
);
const PhysicsScene = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.PhysicsScene }))
);
const TimelineEvent = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.TimelineEvent }))
);
const CodeWalkthrough = lazy(() =>
  import('@fgu/catalog/educational').then((m) => ({ default: m.CodeWalkthrough }))
);

/**
 * Renders whichever component the editor is currently working on. We isolate
 * runtime errors from the renderer (NaN math, malformed data) inside an
 * error boundary so the form stays editable even when the preview throws.
 */
export function Preview({
  spec,
  error,
}: {
  spec: { component: string } & Record<string, unknown>;
  error: string | null;
}) {
  return (
    <div className="absolute inset-0 bg-black">
      {error && (
        <div className="absolute top-4 left-4 right-4 z-10 rounded-lg bg-red-900/40 border border-red-500/30 px-3 py-2 text-xs text-red-200 font-mono">
          {error}
        </div>
      )}
      <Suspense fallback={null}>
        <ErrorBoundary
          fallback={(e) => (
            <div className="absolute inset-0 flex items-center justify-center text-red-300/70 text-xs font-mono p-6 text-center">
              renderer threw: {e.message}
            </div>
          )}
        >
          <RenderSwitch spec={spec} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

function RenderSwitch({
  spec,
}: {
  spec: { component: string } & Record<string, unknown>;
}) {
  switch (spec.component) {
    case 'StepThrough':
      return <StepThrough spec={spec as unknown as StepThroughSpec} />;
    case 'FunctionPlot':
      return <FunctionPlot spec={spec as unknown as FunctionPlotSpec} />;
    case 'SortingVisualizer':
      return (
        <SortingVisualizer spec={spec as unknown as SortingVisualizerSpec} />
      );
    case 'PhysicsScene':
      return <PhysicsScene spec={spec as unknown as PhysicsSceneSpec} />;
    case 'TimelineEvent':
      return <TimelineEvent spec={spec as unknown as TimelineEventSpec} />;
    case 'CodeWalkthrough':
      return (
        <CodeWalkthrough spec={spec as unknown as CodeWalkthroughSpec} />
      );
    default:
      return null;
  }
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: (e: Error) => ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
