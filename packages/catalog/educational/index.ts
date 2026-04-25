/**
 * Educational component catalog — public exports.
 *
 * Components live here so they can be imported by:
 *   - apps/demo  (consumer app via path alias)
 *   - apps/studio (visual designer)
 *   - third parties via the SDK
 */

export * from './schemas';

export { StepThrough } from './StepThrough';
export { FunctionPlot } from './FunctionPlot';
export { SortingVisualizer } from './SortingVisualizer';
export { PhysicsScene } from './PhysicsScene';
export { TimelineEvent } from './TimelineEvent';
export { CodeWalkthrough } from './CodeWalkthrough';

export { compileExpr } from './safeMath';
