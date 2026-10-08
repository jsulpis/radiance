# Run a simulation with ping-pong framebuffers

If a computation reads its own previous output — particles, fluids, cellular automata — use `pingPongFBO`. It keeps two render targets and swaps them after each step, so the shader reads generation `n` while writing generation `n+1`.

```ts
import { glContext, pingPongFBO } from "@radiancejs/gl";

const { gl, canvas } = glContext({ canvas: "#glCanvas" });

const simulation = pingPongFBO({
  gl,
  fragment: /* glsl */ `
    uniform sampler2D tData;
    varying vec2 vUv;

    void main() {
      vec4 previous = texture2D(tData, vUv);
      gl_FragColor = previous + vec4(0.01, 0., 0., 0.); // one step of "something"
    }
  `,
  dataTexture: {
    name: "tData", // must match the sampler2D above (default: "tData")
    initialData: new Float32Array(64 * 64 * 4), // RGBA floats, 4 per cell
  },
});

simulation.render(); // advance one step
```

## The state texture

`dataTexture.initialData` is a flat list of RGBA floats — 4 numbers per element. `createFloatDataTexture` (used internally) packs it into a square float texture and pads with `-1` if the count is not a perfect square.

| Property        | Meaning                                                  |
| --------------- | -------------------------------------------------------- |
| `name`          | sampler2D uniform the shader reads (default `"tData"`)    |
| `initialData`   | `Float32Array \| number[]`, 4 floats per element          |

After each `render()`, `simulation.texture` is the current state — a `DataTextureParams` (first step) or `WebGLTexture`, sampleable from any other pass.

## Stepping

`render()` advances exactly one step. Pacing is yours:

```ts
import { loop } from "@radiancejs/gl";

let last = 0;
loop(({ elapsedTime }) => {
  if (elapsedTime - last < 16) return;
  simulation.uniforms.uDeltaTime = 0.016;
  simulation.render();
  display.render();
  last = elapsedTime;
});
```

Add uniforms like `uDeltaTime` to the simulation for anything time-dependent; they are ordinary reactive sources (see [Uniform values and sources](../reference/uniform-sources)).

## Reading the state per element

`simulation.coords` is an `Attribute` with one UV pair per element — the coordinates of every texel of the state texture. Feed it to a vertex shader to place one vertex per element:

```ts
const display = glCanvas({
  canvas,
  vertex: /* glsl */ `
    uniform sampler2D uPositions;
    in vec2 aCoords;

    void main() {
      gl_Position = vec4(texture2D(uPositions, aCoords).xy, 0., 1.);
      gl_PointSize = 8.;
    }
  `,
  fragment: /* glsl */ ` … `,
  uniforms: {
    uPositions: () => simulation.texture, // re-resolved before every draw
  },
  attributes: {
    aCoords: simulation.coords,
  },
  blending: "additive",
});
```

This is how [GPGPU particles](../../examples/gpgpu/particles/) and [Boids](../../examples/gpgpu/boids/) turn a state texture into points on screen.

## Several coupled fields

A simulation often needs more than one texture (positions + velocities). Give each its own `pingPongFBO` and cross-wire them with function uniforms:

```ts
const positions = pingPongFBO({
  gl,
  fragment: positionsFragment,
  dataTexture: { name: "tPositions", initialData: positionData },
  uniforms: {
    tVelocities: () => velocities.texture,
    uDeltaTime: 0,
  },
});

const velocities = pingPongFBO({
  gl,
  fragment: velocitiesFragment,
  dataTexture: { name: "tVelocities", initialData: velocityData },
  uniforms: {
    tPositions: () => positions.texture,
  },
});

loop(({ deltaTime }) => {
  positions.uniforms.uDeltaTime = deltaTime / 500;
  positions.render();
  velocities.render();
});
```

Render both before using either. [Boids](../../examples/gpgpu/boids/) does exactly this.

::: tip Precision
State lives in RGBA32F. Values outside the float32 range (or needing more than ~7 decimal digits) will quantize; positions that grow without bound lose precision. Wrap or renormalize in the update shader when it matters.
:::

## When to use transform feedback instead

Ping-pong treats state as an **image**: one texel per element, sampled by coordinates. If your state is a **stream** (one record per vertex) and you want the result in a buffer, [transform feedback](./transform-feedback) is the better tool. The trade-off is discussed in [About GPU computation](../concepts/gpgpu).

## See also

- [About GPU computation](../concepts/gpgpu) — the two GPGPU patterns compared.
- [Game of Life](../../examples/gpgpu/game-of-life/), [Particles](../../examples/gpgpu/particles/), [Boids](../../examples/gpgpu/boids/).
