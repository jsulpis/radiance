# Update uniforms at runtime

If you need a shader to pick up a new value — from a slider, an event, a network response — assign it to the `uniforms` object of the pass. The assignment schedules a render.

```ts
const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uColor: [0.35, 0.65, 1],
  },
});

// later, from anywhere in your code:
uniforms.uColor = [1, 0.4, 0.4]; // ← one render on the next animation frame
```

The same object exists on every pass: `scene.uniforms`, `sepia.uniforms`, `bloomEffect.uniforms`. Updating any of them schedules a render of the whole chain.

## Assign whole values

The proxy only observes top-level assignments. Replace the value, do not poke inside it:

```ts
uniforms.uOffset = [1, 0]; // ✅ observed
uniforms.uOffset[0] = 1; // ❌ mutates in place, nothing is notified
```

When a uniform depends on previous state, read it out first — the proxy returns the value you last assigned:

```ts
const [x, y] = uniforms.uPointer as [number, number];
uniforms.uPointer = [x + dx, y + dy];
```

This only works for entries that hold a value. A function or promise entry reads back as the source itself (the function or the promise), not its resolved output — keep your own copy of the state if you need it.

## Batch updates without extra frames

Several assignments in the same tick are merged: Radiance requests one render per animation frame, not one per assignment.

```ts
uniforms.uA = 1;
uniforms.uB = 2;
uniforms.uC = 3; // → exactly one render
```

## Sources other than values

The initial `uniforms` object (and any later reassignment of a whole entry) accepts three kinds of **source**, resolved before each render — see [Uniform values and sources](../reference/uniform-sources) for the full table.

| Source   | Example                                | Resolved                        |
| -------- | -------------------------------------- | ------------------------------- |
| Value    | `uColor: [1, 0, 0]`                    | Immediately                     |
| Function | `uTime: ({ time }) => time / 1000`     | Before every render             |
| Promise  | `uPicture: loadTexture("texture.png")` | When it settles, then on update |

Function sources receive the frame context — `time`, `deltaTime`, `elapsedTime`, `canvasResolution`, `passResolution` (and `inputPass` / `previousPass` in effects). They must be synchronous.

To swap a source for another (say, a promise for a placeholder):

```ts
uniforms.uPicture = { data: placeholderBytes, width: 1, height: 1 };
// …later:
uniforms.uPicture = await loadTexture("https://example.com/photo.jpg");
```

::: tip Detecting updates
`onUpdated((name, value, oldValue) => …)` on a pass fires whenever one of its uniform sources changes — useful for logging or mirroring state elsewhere. `onAfterRender` on `glCanvas` fires once per completed frame.
:::

## Bind a UI control

Anything that produces input events works. With [tweakpane](https://tweakpane.github.io/docs/) it is a one-liner, because the binding writes to `uniforms` for you:

```ts
import { Pane } from "tweakpane";

const pane = new Pane({ title: "Uniforms" });
pane.addBinding(uniforms, "uScale", { min: 0.5, max: 4 });
```

See [Uniforms](../../examples/basics/uniforms/) for a complete example.

## See also

- [Choose when to render](./render-modes) — what happens after the assignment.
- [About reactive rendering](../concepts/reactive-rendering) — the model behind the proxy.
- [Uniform values and sources](../reference/uniform-sources) — what each uniform can hold.
