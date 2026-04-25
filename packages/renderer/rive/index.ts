/**
 * Rive renderer — public exports.
 *
 * Closes #5: bridges LLM tool output to a Rive state machine running on the
 * @rive-app/react-canvas runtime (120fps, GPU-accelerated). The bridge pushes
 * `inputs` into the running state machine without remounting, so a single
 * agent message can scrub a number input or fire a trigger.
 */

export * from './schemas';
export { RivePlayer } from './RivePlayer';
