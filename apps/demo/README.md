# full-gen-ui / demo app

A living AI interface — the LLM decides what appears on screen, visual components animate on the GPU.

## Quick start

```bash
cd apps/demo
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. User types a message
2. `POST /api/chat` calls Claude with `componentTools` as tool definitions
3. Claude selects a visual component and populates its parameters
4. The Zod schema validates the output
5. `GenUIRenderer` lazy-loads and mounts the correct Canvas/PixiJS renderer
6. The visual animates on screen — no video, no pre-render, pure browser GPU

## Component catalog

| Component | Trigger | Renderer |
|---|---|---|
| `particleField` | Abstract topics, atmosphere, energy | Canvas 2D + mouse interaction |
| `waveform` | Audio, oscillation, data over time | Canvas 2D animated |
| `conceptDiagram` | Systems, relationships, flows | Canvas 2D force simulation |
| `counter` | Statistics, quantities, facts | CSS + requestAnimationFrame |
| `textReveal` | Insights, quotes, key takeaways | React + CSS transitions |

## Adding a component

1. Add a Zod schema in `lib/schemas.ts`
2. Register a tool in `lib/tools.ts`
3. Create a renderer in `components/renderers/`
4. Add the case to `components/GenUIRenderer.tsx`

That's it — the LLM will automatically start using the new component.
