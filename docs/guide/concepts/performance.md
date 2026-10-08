# About performance

Radiance gives you a reactive renderer and a small bundle; it does not make a heavy shader cheap. This page is where the time and memory actually go, and which knobs matter.

## The cost of a frame

Roughly, in order of magnitude:

| Cost                  | Scales with                                            |
| --------------------- | ------------------------------------------------------ |
| Your fragment shader  | canvas pixels × `dpr²` × shader complexity             |
| Each post effect      | its target pixels × shader complexity                  |
| Vertex work           | vertex count (usually noise next to fill rate)         |
| Uploads and readbacks | bytes transferred, **plus a sync point** for readbacks |
| CPU scripting         | your code (often unmeasurable next to the above)       |

Fill rate dominates. A fullscreen quad at 1440p is ~3.7 million fragments — ~15 million on a 2× display; each effect you add runs another shader over millions of pixels.

## The three knobs

**1. Device pixel ratio.** `dpr` defaults to `Math.min(devicePixelRatio, 2)`. Lowering it to `1` quarters the fragment work for a fullscreen canvas and is the single biggest lever. See [Handle resize and device pixel ratio](../essentials/resize-and-dpr).

```ts
glCanvas({ canvas: "#glCanvas", fragment, dpr: 1 });
```

**2. Number of passes.** Every entry in `postEffects` is a full-screen pass. `bloom` alone is a pyramid of ~15. If the look allows it, prefer one combined effect over three chained ones, and prefer `resolutionScale: 0.5` on blur-like custom effects.

**3. Render mode.** A canvas that draws only when something changes ([`"auto"`](../essentials/render-modes)) costs nothing while idle. A `"continuous"` canvas pays full price 60 times a second whether or not the image changed.

```ts
renderMode: "auto", // still image, pointer-driven piece
```

That is also why [reactivity](./reactive-rendering) is a performance feature: it turns "always drawing" into "drawing when needed" without you managing a dirty flag.

## Where the memory goes

| Resource                  | Size                                                    |
| ------------------------- | ------------------------------------------------------- |
| The canvas drawing buffer | `cssWidth × cssHeight × dpr² × 4` bytes                 |
| Each render target        | same formula (an `effectPass` owns one by default)      |
| `bloom`'s pyramid         | ~1.7× the canvas (half-res steps + a full-res combine)  |
| `trails`                  | 4 × canvas (a ping-pong pair + one target per sub-pass) |
| A `pingPongFBO` state     | 2 × elements × 4 floats (RGBA32F)                       |

Half-res targets (`resolutionScale: 0.5`) and smaller `dpr` cut this proportionally. Everything above is released by `dispose()` — see [Mount and unmount in a UI framework](../advanced/mount-in-a-ui-framework).

## GPGPU specifics

- **Readbacks stall.** `transformFeedback.getOutputData` waits for the GPU to finish. Keep results in `outputBuffers` between steps when you can ([About GPU computation](./gpgpu)).
- **Float state is heavy.** RGBA32F at 1024×1024 is 16 MB per target; a ping-pong is 32 MB. Size the field to the problem, not to the screen.
- **Step at the rate you need.** A simulation at 60 Hz and one at 15 Hz differ by 4×. Step in a `loop` with your own gate, as in [Run a simulation with ping-pong framebuffers](../gpgpu/ping-pong-simulations).

## Bundle size

Radiance is tree-shakeable and ships as ESM: import what you use and the rest is dropped. The entry points worth knowing:

| Import                           | What it pulls in                                          |
| -------------------------------- | --------------------------------------------------------- |
| `glCanvas`                       | context, quad pass, compositor, resize, scheduling, clock |
| `bloom` / `trails` / …           | only that effect's passes and shaders                     |
| `createProgram`, `renderPass`, … | the core pieces, individually                             |

The smallest possible program is a `glCanvas` with one fragment shader and no effects — that is the figure highlighted in [Why this lib?](../introduction/why-this-lib).

## Measuring

- `onAfterRender` / `onBeforeRender` bracket the chain: cheap frame counters and JS timings ([Choose when to render](../essentials/render-modes)).
- The browser's Performance panel shows whether you are CPU- or GPU-bound (long "GPU" tasks in the main thread waterfall usually mean fill rate).
- Toggle `postEffects: []` to see what the chain costs; toggle `dpr: 1` to see what the pixels cost.

::: tip First things first
Before optimizing a shader, count how many pixels it runs on. Halving the resolution often beats every math trick in the book — and blur-like effects can run at quarter resolution for free, visually.
:::

## See also

- [About reactive rendering](./reactive-rendering) — why idle canvases are free.
- [About the rendering pipeline](./rendering-pipeline) — what each pass costs in machinery.
- [About GPU computation](./gpgpu) — trade-offs of the simulation helpers.
