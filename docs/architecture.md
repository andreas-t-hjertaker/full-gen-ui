# Architecture

See the main [README](../README.md) for the full 3-layer architecture overview.

## Layer 1 — Intent Reasoning

The LLM acts as a **director**, not a coder. It receives the user's input and decides which components to show, in what order, with what parameters. It communicates this as structured JSON via tool calling — never generating raw render code directly.

### Protocols
- **AG-UI** (CopilotKit) — bidirectional SSE event stream between agent and UI layer
- **A2UI** (Google, open standard) — declarative component spec format; agent requests components from a pre-approved catalog

### Latency strategy
- Structured JSON output is 17× faster than generating React code
- Streaming token-by-token means the first component appears before the full response is ready
- Skeleton components render immediately (<100ms) while content hydrates

## Layer 2 — Component Catalog

The catalog is the visual **vocabulary** — a Zod-validated set of animated components the LLM can choose from.

### Pre-built components
- Defined with `name`, `description`, and a Zod parameter schema
- LLM sees the schema in its system prompt as tool definitions
- Renders immediately — zero compile time
- Covers: educational animations, data visualizations, particle systems, UI transitions

### Live-generated components
- LLM generates JSX/Canvas/p5.js code for novel scenarios
- Compiled in-browser via Babel + JSPM (no server-side compilation)
- Sandboxed for security
- Used for creative, one-off visualizations

## Layer 3 — Visual Render Engine

All rendering happens client-side on the GPU.

| Engine | Use Case |
|---|---|
| PixiJS v8 | 2D scenes, particles, sprites (WebGL/WebGPU, 100k+ objects) |
| Rive | Interactive components with state machines (120fps, GPU renderer) |
| Three.js | 3D scenes and volumetric effects |
| p5.js 2.0 | Generative/creative sketches, GPU shaders in JS |
| GSAP | DOM/SVG sequenced animations, ScrollTrigger |
| GLSL | Direct GPU shader programs (AI Co-Artist pattern) |

## Multi-Agent Architecture (Educational Mode)

```
Orchestrating Agent
├── Content Agent       → pedagogical reasoning, step-by-step logic
├── Visual Agent        → maps content to animation parameters / component selection
└── Narration Agent     → synchronizes speech narration with visual events
```

Inspired by LAVES (Baidu, 2026): produces structured executable scripts, not pixels.
