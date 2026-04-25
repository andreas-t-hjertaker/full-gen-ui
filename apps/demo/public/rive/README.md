# Rive demo assets

Drop a `.riv` file here named `demo.riv` to enable the Rive renderer in the
demo app.

The bundled tool descriptor in `apps/demo/lib/tools.ts` advertises:

- url: `/rive/demo.riv`
- stateMachine: `Main`
- inputs: any combination of Number, Bool, or Trigger inputs defined inside
  that state machine

Suggested starter assets:

- https://rive.app/community/files/  — community library
- Open the file in the Rive editor, ensure a state machine called `Main`
  exists with a few inputs (e.g. `mood: number`, `wave: trigger`,
  `dark: boolean`), then export it as a runtime `.riv`.

Once the file is present, the `renderRiveAnimation` tool will drive it from
LLM input.
