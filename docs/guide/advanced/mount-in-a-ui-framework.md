# Mount and unmount in a UI framework

If the canvas lives in a component, create the pipeline in the mount hook and call `dispose()` in the unmount hook. Nothing else is framework-specific — `glCanvas` has no global state.

## React

```tsx
import { glCanvas, type GLCanvas } from "@radiancejs/gl";
import { useEffect, useRef } from "react";

export function ShaderView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const instance: GLCanvas = glCanvas({
      canvas,
      fragment,
      uniforms: {
        uTime: ({ time }) => time / 1000,
      },
    });

    return () => instance.dispose(); // releases targets, observers, clock
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", aspectRatio: "1" }} />;
}
```

::: info StrictMode mounts twice
In development, React 18+ StrictMode runs effects twice. React reuses the same `<canvas>`, so the second `glCanvas` call gets the same WebGL2 context back — what `dispose()` releases is the first instance's programs, targets and observers. If you skip it in the cleanup, that stale instance keeps those GL objects alive until the tab closes.
:::

## Vue

```vue
<script setup lang="ts">
import { glCanvas, type GLCanvas } from "@radiancejs/gl";
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref<HTMLCanvasElement>();
let instance: GLCanvas;

onMounted(() => {
  instance = glCanvas({
    canvas: canvasRef.value!,
    fragment,
    uniforms: { uTime: ({ time }) => time / 1000 },
  });
});

onUnmounted(() => instance?.dispose());
</script>

<template>
  <canvas ref="canvasRef" style="width: 100%; aspect-ratio: 1" />
</template>
```

## Svelte

```svelte
<script lang="ts">
  import { glCanvas, type GLCanvas } from "@radiancejs/gl";
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const instance: GLCanvas = glCanvas({
      canvas,
      fragment,
      uniforms: { uTime: ({ time }) => time / 1000 },
    });
    return () => instance.dispose(); // onMount return = cleanup
  });
</script>

<canvas bind:this={canvas} style="width: 100%; aspect-ratio: 1" />
```

## What `dispose()` releases

One call tears down everything `glCanvas` assembled: the compositor's intermediate render targets, every effect's owned target, the `ResizeObserver`, the animation clock and any pending `requestAnimationFrame`. The same is true for `pingPongFBO`, `transformFeedback`, `effectPass` and `createRenderTarget` — every pass and render-target factory returns a `Disposable` (`loop`, `onResize` and `onPointerEvents` return a `stop()` instead). Call it when the owning code goes away. See [About the rendering pipeline](../concepts/rendering-pipeline#ownership-and-lifetime) for who owns what.

See [About the rendering pipeline](../concepts/rendering-pipeline#ownership-and-lifetime) for who owns what.

## Keeping React state in sync

Uniforms live on the GPU side; React state does not need to mirror them. Push state into the shader when it changes:

```tsx
useEffect(() => {
  instance.uniforms.uColor = color; // schedules a render
}, [color]);
```

Pull shader state into React only when the UI must show it (`onAfterRender`, `onUpdated`) — and prefer `requestAnimationFrame`-friendly throttling for high-frequency values like pointer positions.

## Sizing inside components

Leave the `width`/`height` attributes unset and let CSS (flex, grid, `aspect-ratio`) size the canvas — Radiance's resize observer handles the rest, including transitions and container resizes. Details: [Handle resize and device pixel ratio](../essentials/resize-and-dpr).

::: tip Multiple canvases
One WebGL2 context per canvas, no global registry — mount as many components as you like. `playAllLoops` / `pauseAllLoops` are the only global controls, and they only affect `loop`s you created.
:::

## See also

- [Render in a worker with OffscreenCanvas](./offscreen-worker) — when the work should leave the main thread.
- [Choose when to render](../essentials/render-modes) — stopping the clock with the component.
- [About the rendering pipeline](../concepts/rendering-pipeline) — what a component is actually disposing.
