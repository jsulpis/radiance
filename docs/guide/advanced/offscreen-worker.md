# Render in a worker with OffscreenCanvas

If drawing on the main thread competes with layout and input, move it to a worker. `glCanvas` and `glContext` accept an `OffscreenCanvas` wherever they accept an element or selector.

## Transfer the canvas

```ts
// main.ts
const canvas = document.querySelector("#glCanvas")!;
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker(new URL("./render.worker.ts", import.meta.url), { type: "module" });
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

```ts
// render.worker.ts
import { glCanvas } from "@radiancejs/gl";

self.onmessage = ({ data }) => {
  const { canvas } = data as { canvas: OffscreenCanvas };

  const { uniforms, render } = glCanvas({
    canvas, // an OffscreenCanvas — no DOM required
    fragment,
    uniforms: {
      uTime: ({ time }) => time / 1000,
      uPointer: [0, 0],
    },
    renderMode: "manual", // see "Sizing" below
  });

  self.onmessage = ({ data }) => {
    uniforms.uPointer = data.pointer;
    render();
  };
};
```

`glContext` throws `Canvas element not found.` when the selector matches nothing (or in a worker, where there is no `document`); a canvas that was already transferred makes the browser's `getContext` throw `InvalidStateError`.

## Sizing

An `OffscreenCanvas` has no CSS layout box, so Radiance does not install a resize observer for it — same as a canvas that already has `width`/`height` attributes. Size it yourself and forward layout changes from the page:

```ts
// main.ts — observe the visible canvas and forward its CSS size
const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  worker.postMessage({ size: { width, height } });
});
observer.observe(canvas);
```

```ts
// render.worker.ts
const { setSize, render } = glCanvas({ canvas, fragment, renderMode: "manual" });

self.onmessage = ({ data }) => {
  if (data.size) {
    setSize({
      width: data.size.width * self.devicePixelRatio,
      height: data.size.height * self.devicePixelRatio,
    });
    render();
  }
};
```

`setSize` resizes the canvas and every managed render target in one call. See [Handle resize and device pixel ratio](../essentials/resize-and-dpr) for what the values mean.

## Render mode in a worker

Reactive updates still work — `uniforms` is a proxy and `auto` schedules frames with `requestAnimationFrame`, which exists in workers. What you lose is easy access to DOM-driven input and visibility. Two workable setups:

| Setup                                                              | Notes                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `renderMode: "auto"` + post every pointer/resize message            | the worker renders when messages change uniforms                   |
| `renderMode: "manual"` + `render()` after each message              | explicit; no hidden scheduling                                     |
| `renderMode: "continuous"` for `uTime`-driven work                  | the worker owns its clock; `play`/`pause` via messages              |

```ts
worker.postMessage({ type: "pause" }); // ← your message protocol
```

```ts
// render.worker.ts
const { play, pause, render, uniforms } = glCanvas({ /* … */ });

self.onmessage = ({ data }) => {
  if (data.type === "pause") pause();
  if (data.type === "play") play();
};
```

## What crosses the boundary

Everything you send is structured-cloned (or transferred). Keep the traffic dumb:

| Send                          | Do not send                                   |
| ----------------------------- | --------------------------------------------- |
| plain numbers / arrays        | class instances, DOM nodes (after transfer)   |
| transferred `ArrayBuffer`s    | copied large buffers on every frame           |
| coarse state (pointer, time)  | per-frame uniform dumps                       |

Uniform sources that fetch (like `loadTexture`) work in a worker — `fetch` and `createImageBitmap` are available there — as long as the URL is CORS-enabled. See [Sample images, videos and data](../essentials/load-textures).

::: tip Feature detection
`OffscreenCanvas` + WebGL2 is widely available in current browsers, but not universal. Keep the main-thread path as a fallback when you need to support older ones:

```ts
const target = canvas.transferControlToOffscreen
  ? canvas.transferControlToOffscreen()
  : canvas;
```

:::

## See also

- [Mount and unmount in a UI framework](./mount-in-a-ui-framework) — lifecycle and `dispose()` on the page side.
- [Choose when to render](../essentials/render-modes) — the render modes used above.
- [About performance](../concepts/performance) — when the move to a worker actually pays off.
