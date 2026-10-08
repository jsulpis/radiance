# Fix a black or frozen canvas

If nothing renders, or an animation is stuck on one frame, work through this list. The two halves are different problems: a **black** canvas draws the wrong thing (or nothing), a **frozen** canvas draws once and never again.

## Black canvas

### The canvas has `width` / `height` attributes

Radiance only auto-sizes a canvas whose attributes are unset. With them present, the drawing buffer keeps whatever size they say.

```html
<!-- ❌ Radiance will not touch these -->
<canvas id="glCanvas" width="800" height="600"></canvas>

<!-- ✅ CSS decides the size -->
<canvas id="glCanvas"></canvas>
```

See [Handle resize and device pixel ratio](../essentials/resize-and-dpr).

### The layout size is zero

A `width: 100%` canvas inside a zero-height parent has no pixels to fill. The drawing buffer stays 0×0 and every draw is a no-op. Give the canvas (or its parent) an explicit size or `aspect-ratio`, and check `canvas.width` in the console.

### The shader failed to compile

Radiance logs `could not compile shader: …`, and the pass then fails to initialize: `glCanvas`, `renderPass` and friends throw `could not initialize the render pass`, so nothing is ever drawn. Check the console — the log has the GLSL details. See [Debug shader compilation errors](./debug-shader-errors).

### The fragment shader draws black

Very easy to achieve on purpose or by accident: a mask that multiplies everything by 0, an unlit `vec3(0.)`, a UV used before it is computed. Replace `main()` with `gl_FragColor = vec4(1., 0., 1., 1.);` — if the canvas turns magenta, the pipeline is fine and the maths is not.

### A texture never arrived

A promise uniform that never settles is simply never uploaded, and the shader samples an unbound texture (black). Usual causes: a wrong URL (check the network tab), CORS on a cross-origin image, or a video that cannot autoplay. `loadTexture` throws on a failed fetch; `loadVideoTexture` logs `Failed to load texture: …`. See [Sample images, videos and data](../essentials/load-textures).

### WebGL2 is unavailable

`glContext` throws `No WebGL2 context available.` when `getContext("webgl2")` returns `null` — headless browsers, old devices, blocklisted GPUs. The throw is uncaught and stops your module: another case where the console says more than the canvas.

## Frozen canvas

### `renderMode: "manual"` without a `render()` call

Nothing is scheduled in manual mode. Call `render()` after every change, or switch to `"auto"`. See [Choose when to render](../essentials/render-modes).

### `immediate: false` and no `play()`

The clock starts paused and `uTime` never advances. Call `play()` when you want the animation to start.

### A time uniform that lost its name

Render mode is inferred from uniform names: a function uniform with `time` in its name starts the clock. Rename `uTime` to `uClock` and the inference falls back to `auto` — the canvas renders on updates only, and an animation with nothing to update stays put. Pass `renderMode: "continuous"` explicitly.

### A uniform assigned in place

```ts
uniforms.uOffset[0] = 1; // ❌ mutates an array, the proxy never sees it
uniforms.uOffset = [1, 0]; // ✅ top-level assignment schedules a render
```

See [Update uniforms at runtime](../essentials/update-uniforms).

### A video texture in `manual` mode

Video frames schedule their own renders — in `auto` and `continuous` modes. In `manual` mode nothing is scheduled, so call `render()` yourself (from a `loop`, for example) or leave the mode alone.

### The tab was hidden and the clock paused

If you call `pauseAllLoops()` on `visibilitychange`, remember to call `playAllLoops()` again. `time` (unlike `elapsedTime`) does not jump on resume — see [Choose when to render](../essentials/render-modes#pause-and-resume).

## Still stuck?

Reduce to the smallest thing that can work: one full-screen shader, no uniforms, `gl_FragColor = vec4(vUv, 0., 1.)`. If that draws, re-add pieces one at a time. [Getting Started](../introduction/getting-started) is that minimal case.

## See also

- [Debug shader compilation errors](./debug-shader-errors) — the GLSL side.
- [Choose when to render](../essentials/render-modes) — the scheduling side.
- [About reactive rendering](../concepts/reactive-rendering) — what is supposed to trigger a frame.
