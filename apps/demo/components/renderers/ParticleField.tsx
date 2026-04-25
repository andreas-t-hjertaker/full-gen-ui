/**
 * Legacy alias — the canonical particle renderer now lives in
 * `ParticleFieldPixi.tsx` (PixiJS v8 + WebGL/WebGPU). This re-export keeps any
 * old imports working without churn.
 */
export { ParticleFieldPixi as ParticleField } from './ParticleFieldPixi';
