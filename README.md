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

- [ ] `packages/core` — AG-UI transport + A2UI schema layer
- [ ] `packages/schemas` — Zod component catalog definitions
- [ ] `packages/renderer/pixi` — PixiJS v8 base components
- [ ] `packages/renderer/rive` — Rive state machine bridge
- [ ] `packages/catalog/educational` — First educational component set
- [ ] `packages/live-gen` — In-browser Babel compiler sandbox
- [ ] `packages/sdk` — Public React SDK
- [ ] `apps/studio` — Visual component authoring tool
- [ ] `apps/demo` — Educational demo (math, science, code explanations)

---

## Status

🚧 **Early architecture phase** — laying foundations.

---

## License

MIT
