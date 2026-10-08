# Shader conventions

Naming rules, provided shader inputs, and the GLSL dialect Radiance accepts.

## Naming

| Kind              | Convention        | Example         |
| ----------------- | ----------------- | --------------- |
| Uniforms          | `u` prefix        | `uTime`, `uMix` |
| Attributes        | `a` prefix        | `aPosition`     |
| Varyings          | `v` prefix        | `vUv`, `vColor` |
| Textures          | `t` prefix        | `tCurrentState` |
| Effect samplers   | `uTexture`        | input of an effect pass |

Names are conventions, not enforced — with two exceptions: the attribute named `index` is bound as an element array buffer, and name matching is how optional features find their inputs (see below).

## Name matching

Radiance scans shader source for a few names and adapts when it finds them.

| Looks for                                          | In                        | Effect                                                                                   |
| -------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `varying`/`in` name containing `uv`                | the fragment shader       | the default vertex shader outputs UVs under that name (default `vUv`)                     |
| `attribute`/`in` name containing `position`        | the vertex shader         | full-screen quad positions are supplied under that name (default `aPosition`)             |
| `gl_PointSize`                                     | the vertex shader         | `drawMode` defaults to `"POINTS"` instead of `"TRIANGLES"`                                |
| uniform **function** whose name matches `/time/i`  | `glCanvas` uniforms       | `renderMode` is inferred as `"continuous"` (an animation clock starts)                    |

Rename `uTime` to `uClock` and the clock no longer starts; rename `vUv` to `vTexCoord` and the default vertex shader adapts. Explicit options (`drawMode`, `renderMode`) always win over inference.

## Provided inputs

### Default vertex shader

When you do not pass `vertex` to `glCanvas` / `quadRenderPass`, this is what runs (names adapted as above):

```glsl
in vec2 aPosition;
out vec2 vUv;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = (aPosition + 1.0) / 2.0;
}
```

The geometry is one large triangle `(-1,-1) (3,-1) (-1,3)` covering the viewport — cheaper than a quad, same UVs.

### Frame context

Uniform **functions** receive the frame fields (`time`, `deltaTime`, `elapsedTime`, `canvasResolution`, `passResolution`, and `inputPass` / `previousPass` for effects). Nothing is bound automatically; map what you need. Full table: [Uniform values and sources](./uniform-sources#context).

```ts
uniforms: {
  uTime: ({ time }) => time / 1000,
  uResolution: ({ canvasResolution }) => canvasResolution,
}
```

### Effect pass contract

| Input / output        | Declaration                                          |
| --------------------- | ---------------------------------------------------- |
| Previous pass texture | `uniform sampler2D uTexture;` + `({ inputPass }) => inputPass.target!.texture` |
| UVs                   | `varying vec2 vUv;` (or `in vec2 vUv;`)               |
| Output                | `gl_FragColor = …;` (or `out vec4 fragColor;`)        |
| Geometry              | the built-in full-screen triangle, unless you pass `vertex` |

## GLSL dialect

Every shader is converted to GLSL ES 3.00 before compiling: the keyword rewrites in the table below run on every source, and `#version 300 es` is prepended unless the source declares its own version. Both of the following fragment shaders are valid and equivalent:

```glsl
// GLSL ES 1.00 style (converted for you)
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  gl_FragColor = texture2D(uTexture, vUv);
}
```

```glsl
// GLSL ES 3.00 style (used as-is)
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;

void main() {
  fragColor = texture(uTexture, vUv);
}
```

### Conversion table

| You write                             | Result                                                |
| ------------------------------------- | ----------------------------------------------------- |
| *(source without `#version`)*         | `#version 300 es` prepended                           |
| `attribute`                           | `in`                                                  |
| `varying` (vertex)                    | `out`                                                 |
| `varying` (fragment)                  | `in`                                                  |
| `texture2D(…)`                        | `texture(…)`                                          |
| `gl_FragColor`                        | `fragColor`, plus `out vec4 fragColor;` inserted      |
| *(no float precision declared)*       | `precision highp float;` inserted                     |

The presence of `gl_FragColor` is the marker for "this is a fragment shader" — which is why a fragment shader written in 3.00 style must declare its own `out vec4` and use `in` for varyings. Do not mix the two styles in one shader. Line numbers in compiler logs may be offset by the inserted lines.

A source starting with `#version` keeps its version directive (nothing is prepended), but the keyword rewrites above still apply — write one dialect per shader. The precision default is still added if missing. The built-in effects use `#include` for shared chunks, resolved at build time by [vite-plugin-glsl](../introduction/recommended-tooling) in this documentation, or any bundler with the same feature.

## Attributes

| Field                  | Meaning                                            |
| ---------------------- | -------------------------------------------------- |
| `size`                 | components per vertex                              |
| `data`                 | `TypedArray` or `number[]`                         |
| `type`                 | GL type; inferred from the array when omitted      |
| `normalize`            | normalize fixed-point values                       |
| `stride` / `offset`    | interleaved layout, in bytes                       |

The special attribute name `index` binds an `ELEMENT_ARRAY_BUFFER` (see [Draw custom geometry](../essentials/draw-geometry)). Vertex count comes from the data: `data.length / size`, or `byteLength / stride` with a stride.

`drawMode` accepts `"POINTS" | "LINES" | "LINE_STRIP" | "LINE_LOOP" | "TRIANGLES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN"`, and `blending` accepts `"none" | "normal" | "additive"`.

## See also

- [Uniform values and sources](./uniform-sources) — what can be assigned to a uniform.
- [Debug shader compilation errors](../troubleshooting/debug-shader-errors) — reading the compiler output.
- [API: Types](/api/types/types/) — `Attribute`, `UniformContext`, `UniformValue`.
