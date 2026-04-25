# full-gen-ui

> Next-generation AI interface engine — LLM-orchestrated, GPU-rendered, living visual UI components.

---

## Vision

**full-gen-ui** is an architecture for building AI interfaces that are not bound by static code. Instead of a chat box returning text, the interface is *alive* — visual components animate, morph, and respond in real time, orchestrated by a language model with minimal latency.

Key principles:
- **LLM as director** — the model decides *what* appears on screen, not *how* to render it
- **GPU-first rendering** — all visuals run on the GPU via WebGL/WebGPU (PixiJS v8, Rive)
- **Two component types** — pre-built (zero latency) and live-generated (compiled in-browser)
- **Streaming-first** — components appear progressively as the LLM streams its response
- **Educational-grade** — purpose-built for animated, on-demand explanations that replace video

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Input                          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Layer 1 — Intent Reasoning                 │
│  Orchestrating Agent (LLM)                              │
│  → Selects components from catalog via tool calling     │
│  → Emits structured JSON spec (A2UI-compatible)         │
│  → Streams token-by-token via AG-UI protocol            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│           Layer 2 — Component Catalog                   │
│  Pre-built components  │  Live-generated components     │
│  (Zod-validated,       │  (LLM generates JSX/Canvas     │
│   instant render)      │   compiled in-browser via      │
│                        │   Renderify/Babel+JSPM)         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│           Layer 3 — Visual Render Engine                │
│  PixiJS v8 (2D/GPU)  │  Rive (state machines)          │
│  Three.js (3D)       │  p5.js 2.0 (generative)         │
│  GSAP (sequences)    │  GLSL shaders (direct GPU)       │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
full-gen-ui/
├── packages/
│   ├── core/                  # Protocol layer (AG-UI, A2UI)
│   │   ├── agent/             # LLM orchestration & tool calling
│   │   ├── streaming/         # Token streaming & progressive render
│   │   └── schemas/           # Zod schemas for all components
│   │
│   ├── renderer/              # Visual engine bindings
│   │   ├── pixi/              # PixiJS v8 components
│   │   ├── rive/              # Rive state machine components
│   │   ├── p5/                # p5.js 2.0 generative sketches
│   │   └── glsl/              # GLSL shader components
│   │
│   ├── catalog/               # Pre-built animated component library
│   │   ├── educational/       # STEM animations, diagrams, step-through
│   │   ├── data/              # Charts, graphs, live data visuals
│   │   ├── spatial/           # 3D scenes, particle systems
│   │   └── ui/                # Buttons, transitions, micro-animations
│   │
│   ├── live-gen/              # In-browser component code generation
│   │   └── renderify/         # Babel+JSPM sandboxed compiler
│   │
│   └── sdk/                   # Public SDK (React + framework-agnostic)
│
├── apps/
│   ├── studio/                # Visual component studio (dev tool)
│   └── demo/                  # Educational demo app
│
├── docs/                      # Architecture docs
└── research/                  # Reference papers and findings
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM Orchestration | Claude 3.7 Sonnet / GPT-4o (tool calling) |
| Streaming / Transport | AG-UI protocol (CopilotKit) |
| Component Spec | A2UI JSON (Google open standard) |
| GenUI Middleware | Thesys C1 API |
| SDK | Vercel AI SDK (TypeScript) |
| 2D Visual Engine | PixiJS v8 (WebGL/WebGPU) |
| Interactive Animations | Rive (state machines, 120fps GPU) |
| 3D | Three.js |
| Generative / Creative | p5.js 2.0 |
| Shader Layer | GLSL / Shader Park |
| Schema Validation | Zod |
| Framework | Next.js + React |

---

## Educational Use Case

A core application is **on-demand animated explanations** — replacing static video with living, in-browser animations generated from a user's question.

Inspired by:
- **LAVES** (Baidu, 2026) — LLM multi-agent system producing 1M+ educational animations/day
- **LLM2Manim** (arXiv, April 2026) — pedagogy-aware STEM animations, d=1.64 satisfaction vs. slides
- **OpenGenerativeUI** (CopilotKit) — open reference implementation for visualize-anything agents

The key insight: *do not generate pixels — generate executable animation code and run it in the browser.*

---

## Roadmap

- [x] `packages/core/streaming` — AG-UI transport (issue #2)
- [x] `packages/core/agent` — multi-agent orchestration for educational mode (issue #6)
- [x] `packages/renderer/pixi` — PixiJS v8 ParticleField (issue #1)
- [x] `packages/renderer/rive` — Rive state machine bridge (issue #5)
- [x] `packages/catalog/educational` — first educational component set (issue #4)
- [x] `packages/live-gen/renderify` — in-browser Babel compiler sandbox (issue #3)
- [x] `apps/studio` — visual component authoring tool (issue #7)
- [x] `apps/demo` — chat + educational demo
- [ ] `packages/sdk` — public React SDK (next)

---

## MVP — what's running

```
apps/demo                     apps/studio
─────────────                 ─────────────
http://localhost:3000   /     http://localhost:3001
                              ↳ catalog browser + live editor
↳ chat → renders any spec     ↳ "Test with LLM" panel
↳ /educate → narrated lesson  ↳ JSON spec export
```

### Run it

```bash
cd apps/demo
cp .env.example .env.local       # add ANTHROPIC_API_KEY
pnpm install
pnpm dev                         # localhost:3000

# in another shell
cd apps/studio
cp .env.example .env.local
pnpm install
pnpm dev                         # localhost:3001
```

### Component catalog (educational)

| Tool                       | Use for |
| -------------------------- | --- |
| `renderStepThrough`        | procedural how-it-works explanations |
| `renderFunctionPlot`       | math functions, plots, calculus |
| `renderSortingVisualizer`  | algorithmic complexity (bubble/insertion/selection/merge/quick) |
| `renderPhysicsScene`       | gravity / pendulum / wave / collisions / orbit |
| `renderTimelineEvent`      | history, evolution, milestones |
| `renderCodeWalkthrough`    | annotated code reveals |

### Transports

`/api/chat` — Vercel AI SDK `useChat` (token-by-token JSON stream).
`/api/agui` — AG-UI canonical event stream over SSE (`useAGUI` hook in `@fgu/core/streaming`).
`/api/educate` — multi-agent orchestrated lesson stream (issue #6).

---

## License

MIT
