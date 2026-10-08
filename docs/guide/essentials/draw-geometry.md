# Draw custom geometry

If you need triangles, lines or points instead of a full-screen quad, pass a vertex shader and your attributes to `glCanvas` (or to `renderPass` if you are assembling the pipeline yourself).

```ts
glCanvas({
  canvas: "#glCanvas",
  vertex: /* glsl */ `
    attribute vec2 position;
    attribute vec3 color;
    varying vec3 vColor;

    void main() {
      gl_Position = vec4(position, 0., 1.);
      vColor = color;
    }
  `,
  fragment: /* glsl */ `
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.);
    }
  `,
  attributes: {
    position: { size: 2, data: [-0.5, -0.5, -0.5, 0.5, 0.5, 0.5] },
    color: { size: 3, data: [0, 1, 1, 0, 1, 0, 0, 0, 1] },
  },
  drawMode: "TRIANGLES",
});
```

`attributes` maps a shader input to its data and layout. The vertex count is derived from the data (`data.length / size`, or `byteLength / stride` when you set one).

| Field       | Meaning                                                       | Default                    |
| ----------- | ------------------------------------------------------------- | -------------------------- |
| `size`      | Components per vertex (2 for `vec2`, 3 for `vec3`, …)         | —                          |
| `data`      | `TypedArray` or `number[]` of vertex data                     | —                          |
| `type`      | GL type of the components                                     | inferred from the array    |
| `normalize` | Normalize fixed-point values to \[0, 1\] or \[-1, 1\]         | `false`                    |
| `stride`    | Byte distance between consecutive vertices (interleaved data) | `0` (tightly packed)       |
| `offset`    | Byte offset of the first component                            | `0`                        |

## Interleaved data

When several attributes share one buffer, upload it once and describe the layout with `stride` and `offset`:

```ts
// [x, y, r, g, b] per vertex
const interleaved = new Float32Array([
  -0.5, -0.5, 1, 0, 0, //
  -0.5, 0.5, 0, 1, 0, //
  0.5, 0.5, 0, 0, 1,
]);

attributes: {
  position: { size: 2, data: interleaved, stride: 5 * 4, offset: 0 },
  color: { size: 3, data: interleaved, stride: 5 * 4, offset: 2 * 4 },
}
```

## Index buffers

To reuse vertices, add an `index` attribute. It binds an `ELEMENT_ARRAY_BUFFER` and switches the draw call to `drawElements`:

```ts
attributes: {
  aPosition: { size: 2, data: positions },
  index: { size: 1, data: indices },
}
```

See [Indices](../../examples/basics/indices/) for a grid built this way.

## Draw modes

`drawMode` accepts any WebGL primitive: `"POINTS"`, `"LINES"`, `"LINE_STRIP"`, `"LINE_LOOP"`, `"TRIANGLES"`, `"TRIANGLE_STRIP"`, `"TRIANGLE_FAN"`.

If you omit it, Radiance picks `"POINTS"` when the vertex shader contains `gl_PointSize`, and `"TRIANGLES"` otherwise. Set `gl_PointSize` for point sprites and `blending: "normal"` or `"additive"` when you want them to accumulate — see [Particles](../../examples/basics/particles/).

```ts
glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  attributes,
  drawMode: "TRIANGLE_STRIP",
  blending: "additive",
  depthTest: true,
});
```

[Drawing modes](../../examples/basics/drawing-modes/) renders the same four vertices with every mode, which is the fastest way to see the difference.

::: tip Attribute name matching
For a full-screen pass without your own vertex shader, Radiance supplies the quad positions under whatever attribute name it finds containing `position`. With your own vertex shader, names are yours — just keep them in sync between `attributes` and the shader.
:::

## Draw without `glCanvas`

For full control over the frame, create the program and pass yourself:

```ts
import { glContext, renderPass } from "@radiancejs/gl";

const { gl } = glContext({ canvas: "#glCanvas" });

const mesh = renderPass({
  gl,
  vertex,
  fragment,
  attributes,
  uniforms: { uTime: 0 },
  drawMode: "TRIANGLES",
});

mesh.render();
```

`renderPass` accepts the same `attributes` and also functions and promises as uniform sources; `rawRenderPass` is the lower-level variant with concrete uniform values only. See [About the rendering pipeline](../concepts/rendering-pipeline#which-layer-to-reach-for) for where each fits.

## See also

- [Drawing modes](../../examples/basics/drawing-modes/) and [Indices](../../examples/basics/indices/) — the two demos worth reading in full.
- [Capture vertex output with transform feedback](../gpgpu/transform-feedback) — running vertex shaders without rasterizing.
- [Shader conventions](../reference/shader-conventions) — `attribute` / `varying` naming and the GLSL dialect.
