# Capture vertex output with transform feedback

If a vertex shader computes values you want back — as buffers, for CPU readback or for the next pass — use `transformFeedback`. It runs the vertex stage with rasterization disabled and writes the declared outputs to GPU buffers.

```ts
import { glContext, transformFeedback } from "@radiancejs/gl";

const { gl } = glContext({ canvas: "#glCanvas" });

const square = transformFeedback({
  gl,
  vertex: /* glsl */ `
    in float aIndex;
    uniform float uValue;
    out float result;

    void main() {
      result = uValue * float(aIndex);
    }
  `,
  attributes: {
    aIndex: { size: 1, data: [0, 1, 2, 3] },
  },
  uniforms: {
    uValue: 2,
  },
  outputs: {
    result: { size: 1 }, // varying name → component count
  },
});

square.render();

const data = square.getOutputData("result"); // Float32Array [0, 2, 4, 6]
```

## The pieces

| Parameter    | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| `vertex`     | vertex shader that writes to each output varying                     |
| `attributes` | input streams, same shape as any pass (see [Draw custom geometry](../essentials/draw-geometry)) |
| `uniforms`   | ordinary reactive sources                                            |
| `outputs`    | map of **varying name → `{ size }`** (components: 1 for `float`, 3 for `vec3`, …) |

The vertex count comes from the first attribute (`data.length / size`). Each `render()` runs one vertex shader invocation per vertex and captures the outputs.

| Member             | Meaning                                                  |
| ------------------ | -------------------------------------------------------- |
| `getOutputData(name)` | `Float32Array` copy of one output buffer (CPU readback) |
| `outputBuffers`    | raw `WebGLBuffer` handles, for native WebGL interop     |

The shader must declare each key of `outputs` as an `out` (or `varying`) with a matching type — `out float result` for `size: 1`, `out vec3 velocity` for `size: 3`. The internal draw uses `POINTS` and `GL_RASTERIZER_DISCARD`; nothing is rasterized.

## Feed the result to another pass

Read a buffer back with `getOutputData` and upload the `Float32Array` as the attribute data of the next pass:

```ts
const data = square.getOutputData("result");

const positions = renderPass({
  gl,
  vertex: nextVertex,
  fragment: nextFragment,
  attributes: {
    aPosition: { size: 1, data, type: gl.FLOAT },
  },
});
```

Attribute data is always a `TypedArray` or `number[]` — `outputBuffers` only exposes the raw `WebGLBuffer` handles for native WebGL interop. (The [Maths](../../examples/gpgpu/maths/) example collects the result on the CPU and compares it against a CPU implementation.)

## A worked example: squaring a matrix

The [Maths](../../examples/gpgpu/maths/) example computes a matrix product with one vertex per output cell, a data texture as the matrix, and `getOutputData` to collect the result:

```ts
const tf = transformFeedback({
  gl,
  vertex: /* glsl */ `
    in float n;
    in float p;
    uniform sampler2D matrixContent;
    out float product;

    void main() {
      product = 0.0;
      int size = textureSize(matrixContent, 0).x;
      for (int i = 0; i < size; i++) {
        product += texelFetch(matrixContent, ivec2(int(n), i), 0).x
                 * texelFetch(matrixContent, ivec2(i, int(p)), 0).x;
      }
    }
  `,
  uniforms: {
    matrixContent: createFloatDataTexture(flatMatrix.flatMap((v) => [v, 0, 0, 0])), // 4 floats per texel
  },
  attributes: {
    n: { size: 1, data: indicesN },
    p: { size: 1, data: indicesP },
  },
  outputs: { product: { size: 1 } },
});

tf.render();
const products = tf.getOutputData("product");
```

## When to use ping-pong instead

Transform feedback is for **streams**: one record per vertex, output to buffers. If the state is an image you want to sample at coordinates next frame (particle positions, a board of cells), [ping-pong framebuffers](./ping-pong-simulations) fit better. Comparison: [About GPU computation](../concepts/gpgpu).

::: tip Readback is the slow part
`getOutputData` waits for the GPU. Keep results on the GPU (`outputBuffers`) when the next step is another pass; read back only when the CPU genuinely needs the numbers.
:::

## See also

- [About GPU computation](../concepts/gpgpu) — the two patterns and when each wins.
- [Maths](../../examples/gpgpu/maths/) — GPU vs CPU matrix multiply.
- [API: Passes](/api/passes/transformFeedback/) — `transformFeedback` and `TransformFeedbackParams`.
