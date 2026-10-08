# Handle resize and device pixel ratio

If the canvas should follow its layout box, leave its `width` and `height` attributes unset and size it with CSS. Radiance keeps the drawing buffer in sync.

```html
<canvas id="glCanvas"></canvas>
```

```css
#glCanvas {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
}
```

```ts
glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});
```

::: info Do not set `width` / `height` attributes
Radiance only sizes a canvas that has no `width`/`height` attributes. If they are present, they are taken as final and no resize observer is installed. Use CSS for the layout size and read `canvasResolution` in the shader for the drawing-buffer size.
:::

## Read the size in the shader

`canvasResolution` is the drawing-buffer size in **device pixels** (CSS size × `dpr`). Map it to a uniform and you can work in pixel space or aspect-corrected space:

```glsl
uniform vec2 uResolution;

void main() {
  // pixel space
  vec2 pixel = vUv * uResolution;

  // centered, aspect-corrected space (x in [-aspect, aspect], y in [-1, 1])
  vec2 uv = 2. * (vUv - .5) * uResolution / min(uResolution.x, uResolution.y);
}
```

Effects have two size fields in their uniform context: `canvasResolution` (the canvas) and `passResolution` (the render target this pass draws into — smaller for half-res bloom steps, for example).

## Choose the pixel ratio

`dpr` multiplies the CSS size to get the drawing buffer. It defaults to `Math.min(devicePixelRatio, 2)`: sharp on retina screens without paying for 3× the pixels on phones.

```ts
glCanvas({
  canvas: "#glCanvas",
  fragment,
  dpr: 1, // half the pixels, useful for heavy fragment shaders
});
```

Lower it for expensive shaders or large canvases; the CSS size is untouched, so the canvas only gets blurrier, not bigger.

## Resize from JavaScript

If you drive the size yourself — a manual layout, an `OffscreenCanvas`, a `renderMode: "manual"` canvas — use `setSize`:

```ts
const { setSize, dpr, render } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  renderMode: "manual",
});

setSize({ width: 800 * dpr, height: 600 * dpr }); // device pixels
render();
```

`setSize` resizes the canvas and every managed render target. In `auto` and `continuous` modes it also schedules a render; in `manual` mode, call `render()` yourself.

## React to size changes yourself

`onResize` wraps a `ResizeObserver` and reports both CSS and device sizes (after the next paint, which avoids glitches during live resizes):

```ts
import { onResize } from "@radiancejs/gl";

const observer = onResize(element, ({ size, devicePixelSize }) => {
  console.log(size, devicePixelSize); // CSS pixels, device pixels
});

observer.stop(); // when you are done
```

`glCanvas` returns its own observer as `resizeObserver` if you need to stop or inspect it.

## See also

- [Fix a black or frozen canvas](../troubleshooting/fix-a-black-canvas) — a zero-size canvas draws nothing.
- [About performance](../concepts/performance) — why `dpr` is the first knob to turn.
- [Resize](../../examples/basics/resize/) — a minimal responsive shader.
