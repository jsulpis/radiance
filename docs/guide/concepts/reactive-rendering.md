# About reactive rendering

Radiance does not run a game loop that redraws every frame. It draws when something changed, and stays idle the rest of the time. This page explains the model and when to step outside it.

## The idea

A render is a response to a change. Update a uniform, resize the canvas, finish loading a texture — each of those schedules a draw. If nothing happens, nothing is drawn, and the GPU stays quiet.

That matters because most canvases are not games. A still image, a gradient that only moves when the user drags a slider, or a shader that reacts to the pointer has no reason to run at 60 fps. Rendering on demand saves battery and leaves the frame budget to the rest of the page.

The example below demonstrates this behavior: the render counter only increments when you interact with the uniform-controlled slider, showing that renders are scheduled reactively rather than continuously.

::: example-editor {deps=tweakpane@^4.0.5}

<<< ../../examples/basics/uniforms/index.ts

<<< ../../examples/basics/uniforms/vertex.frag

<<< ../../examples/basics/uniforms/uniforms.frag

<<< @/snippets/canvas-full/styles.css

<<< @/snippets/render-count/index.html

:::

## What schedules a render

In the default `auto` mode, a render is requested when:

- A uniform value on any pass of the pipeline is updated (including effect uniforms).
- The canvas is resized (the resolution uniforms change too).
- A uniform source resolves later than the first render — a promise uniform that settles, for example a [texture](../essentials/load-textures) finishing its download.
- A video texture presents a new frame: Radiance listens to video frames and updates the uniform for you.

An identical assignment — the same number, or the same object reference — is ignored: the proxy compares for you. A fresh array or object with the same contents still counts as an update.

Several updates in the same tick are merged into a single draw. Updating ten uniforms in a row paints once, on the next animation frame.

## Render modes

Rendering policy is set with `renderMode` on `glCanvas`:

| Mode           | Behaviour                                                     | Use it for                                          |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| `"auto"`       | Draw when something changes, at most once per animation frame | Static images, interactive pieces, UI-bound visuals |
| `"continuous"` | Draw every animation frame                                    | Anything driven by `uTime`                          |
| `"manual"`     | Draw only when you call `render()`                            | Sims you step yourself, canvas export, gated motion |

If you do not pass `renderMode`, Radiance infers it: `continuous` when one of the uniform functions has `time` in its name (`uTime`, `uElapsedTime`, …) AND is a function, `auto` otherwise. That is why adding

```ts
uniforms: {
  uTime: ({ time }) => time / 500,
}
```

to a shader starts a loop all by itself. It is also why the inference is easy to lose — rename the uniform to `uClock` and you fall back to `auto`, and the animation freezes until something else updates. When in doubt, pass `renderMode` explicitly.

In `continuous` mode the clock is a `loop` you can stop: `play()` and `pause()` control it, and `immediate: false` keeps it paused until you ask. See [Choose when to render](../essentials/render-modes) for the recipes.

## The cost of a frame

Rendering on demand is not free of scheduling — it is free of _unnecessary_ scheduling. A render still costs the same: your fragment shader runs once per pixel of the canvas (times the device pixel ratio), plus every [post effect](../post-processing/effect-chain) in the chain. Reactivity decides _when_ that cost is paid, not how large it is.

Two things have a bigger impact on the cost of a frame than anything else: the number of pixels (see [device pixel ratio](../essentials/resize-and-dpr)) and the number of full-screen passes (see [About performance](./performance)).

## Where the reactivity lives

The `uniforms` object returned by `glCanvas` (and by every pass) is a `Proxy`. Writing to it notifies the pass, the pass notifies the compositor, and the compositor requests a render. Nothing watches your shader or your scene: if a value never goes through `uniforms`, Radiance never learns about it.

The same mechanism runs through the whole chain. Updating `bloom.uniforms.uMix` or a custom `effectPass` uniform schedules a render just like the main pass does.

::: tip Silent updates
Only assignments to the `uniforms` object are observed. Mutating an array or texture in place (`uniforms.uOffset[0] = 1`) does not notify anything — assign a new value instead (`uniforms.uOffset = [1, 0]`).
:::

## See also

- [Choose when to render](../essentials/render-modes) — the `renderMode` recipes and the `loop` helper.
- [Update uniforms at runtime](../essentials/update-uniforms) — value, promise and function sources.
- [About the rendering pipeline](./rendering-pipeline) — what those renders actually execute.
- [About performance](./performance) — what a frame costs once it is scheduled.
