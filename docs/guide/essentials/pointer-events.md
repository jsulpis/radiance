# React to pointer events

If a shader should follow the mouse or a finger, use `onPointerEvents`. It normalizes `pointer*` events and keeps the element's bounding rect up to date, so handlers can work in shader coordinates.

```ts
import { glCanvas, onPointerEvents } from "@radiancejs/gl";

const canvas = document.querySelector("canvas")!;

const { uniforms } = glCanvas({
  canvas,
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform vec2 uPointer;

    void main() {
      vec2 uv = 2. * (vUv - .5) * uResolution / min(uResolution.x, uResolution.y);
      float dist = distance(uv, uPointer);
      gl_FragColor = vec4(vec3(1. - smoothstep(.1, .12, dist)), 1.);
    }
  `,
  uniforms: {
    uPointer: [0, 0],
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});

onPointerEvents(canvas, {
  move: ({ pointer, boundingRect, center }) => {
    const halfMin = Math.min(boundingRect.width, boundingRect.height) / 2;
    uniforms.uPointer = [(pointer.x - center.x) / halfMin, (center.y - pointer.y) / halfMin];
  },
});
```

Every handler receives the same arguments.

| Field                  | Meaning                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `pointer.x` / `.y`     | pointer position in client pixels (`clientX` / `clientY`)   |
| `boundingRect`         | live `getBoundingClientRect()` of the element               |
| `center.x` / `.y`      | center of that rect in client pixels                        |

Handlers are optional and map to `pointerenter`, `pointermove`, `pointerleave`, `pointerdown`, `pointerup`:

```ts
const listener = onPointerEvents(canvas, {
  enter: ({ pointer }) => {},
  move: ({ pointer, boundingRect, center }) => {},
  leave: () => {},
  down: ({ pointer }) => {},
  up: ({ pointer }) => {},
});

listener.stop(); // removes every listener and stops the rect tracking
```

The handlers are attached when `onPointerEvents` is called, and `stop()` is final. `boundingRect` is the same object mutated in place (it tracks resizes and scroll), so it is always current — see [Handle resize and device pixel ratio](./resize-and-dpr) for the resize side.

## Convert to shader space

The conversion is up to you, which is the point: the right mapping depends on your shader's maths. The usual three:

```ts
// 1. centered, aspect-corrected (x in [-aspect, aspect], y in [-1, 1]) — matches most Shadertoy-style shaders
const halfMin = Math.min(boundingRect.width, boundingRect.height) / 2;
uniforms.uPointer = [(pointer.x - center.x) / halfMin, (center.y - pointer.y) / halfMin];

// 2. UV space (0 to 1, y up)
uniforms.uPointer = [
  (pointer.x - boundingRect.left) / boundingRect.width,
  1 - (pointer.y - boundingRect.top) / boundingRect.height,
];

// 3. pixels of the drawing buffer
uniforms.uPointer = [
  (pointer.x - boundingRect.left) * (canvas.width / boundingRect.width),
  (pointer.y - boundingRect.top) * (canvas.height / boundingRect.height),
];
```

Each assignment schedules a render, so a canvas that only reacts to the pointer stays idle otherwise — see [About reactive rendering](../concepts/reactive-rendering).

## Smooth the motion

Pointer events arrive faster than needed and are jittery on touch. Ease toward a target in a `loop` instead of assigning the raw position:

```ts
import { loop } from "@radiancejs/gl";

const target = { x: 0, y: 0 };
// …update `target` in the pointer handlers…

loop(() => {
  const [x, y] = uniforms.uPointer as [number, number];
  const dx = target.x - x;
  const dy = target.y - y;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
  uniforms.uPointer = [x + dx * 0.07, y + dy * 0.07];
});
```

## See also

- [Pointer coordinates](../../examples/interactions/pointer/) — a complete circle that follows the pointer.
- [Update uniforms at runtime](./update-uniforms) — what the assignments trigger.
