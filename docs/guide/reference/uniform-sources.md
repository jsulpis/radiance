# Uniform values and sources

What a uniform can hold, how it gets to the GPU, and when it is resolved.

## Values

`UniformValue` — the concrete data uploaded to GLSL.

| Type                                             | GLSL                                | Example                                     |
| ------------------------------------------------ | ----------------------------------- | ------------------------------------------- |
| `number`                                         | `float`                             | `uScale: 1.5`                               |
| `boolean`                                        | `bool`                              | `uEnabled: true`                            |
| `[number, number]`                               | `vec2`                              | `uPointer: [0, 0]`                          |
| `[number, number, number]`                       | `vec3`                              | `uColor: [1, 0, 0]`                         |
| `[number × 4]`                                   | `vec4`                              | `uRect: [0, 0, 1, 1]`                       |
| `[number × 9]` / `Float32Array(9)`               | `mat3`                              | `uNormalMatrix: […]`                        |
| `[number × 16]` / `Float32Array(16)`             | `mat4`                              | `uModelView: […]`                           |
| `TextureParams`                                  | `sampler2D`                         | `{ data, width, height }` or `{ src }`      |
| `WebGLTexture`                                   | `sampler2D`                         | a texture you created yourself              |

Arrays and `Float32Array`s are matched by length: 2, 3 and 4 for the vector rows, 9 and 16 for the matrices. Any other length is ignored — there is no uniform-block upload. Numbers upload as floats and booleans as integers, so a GLSL `int` uniform takes `true` / `false`.

Texture parameters are documented in [Sample images, videos and data](../essentials/load-textures) and the [API](/api/core/texture/type-aliases/TextureParams). `createFloatDataTexture` returns `DataTextureParams`, which is one form of `TextureParams`.

## Sources

`UniformSource` — what you may put in the `uniforms` object. Each entry is resolved to a `UniformValue` before the pass renders.

| Form                                   | Resolved                              | Notes                                          |
| -------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| `UniformValue`                         | immediately                           | re-rendered on assignment                      |
| `PromiseLike<UniformValue>`            | when it settles                       | not uploaded until then                        |
| `(context) => UniformValue`            | before every render                   | **synchronous** — may not return a promise     |

```ts
uniforms: {
  uColor: [1, 0, 0],                              // value
  uPicture: loadTexture("photo.jpg"),             // promise
  uTime: ({ time }) => time / 1000,               // function
}
```

Assigning to `uniforms.uX` later replaces the source with a value. Updating in place (`uniforms.uX[0] = 1`) is not observed — assign a new value instead. Reading `uniforms.uX` returns what you last assigned: a concrete value for value entries, but the function or promise itself for the other two forms.

## Context

The object passed to function sources (`UniformContext`):

| Field              | Type                | Meaning                                                    |
| ------------------ | ------------------- | ---------------------------------------------------------- |
| `time`             | `number`            | ms since the clock started, excluding pauses               |
| `deltaTime`        | `number`            | ms since the previous frame                                |
| `elapsedTime`      | `number`            | ms since the clock started, including pauses               |
| `canvasResolution` | `[number, number]`  | drawing-buffer size in device pixels                       |
| `passResolution`   | `[number, number]`  | size of the render target this pass draws into             |

Effect passes receive `EffectUniformContext` — the fields above plus:

| Field           | Type         | Meaning                                                     |
| --------------- | ------------ | ----------------------------------------------------------- |
| `inputPass`     | `RenderPass` | the pass rendered before this effect started                |
| `previousPass`  | `RenderPass` | the pass rendered immediately before this sub-pass          |

```ts
uniforms: {
  uTexture: ({ inputPass }) => inputPass.target!.texture,
  uPrevious: ({ previousPass }) => previousPass.target!.texture,
  uTexelSize: ({ passResolution }) => [1 / passResolution[0], 1 / passResolution[1]],
}
```

## Resolution order

For each `render()` of a pass, in this order:

1. Function sources are called with the current context.
2. Promise sources that have settled contribute their value.
3. Concrete values are staged.
4. Everything is uploaded and the draw runs.

A promise that has not settled yet contributes nothing: the uniform is not uploaded at all, so a sampler draws black until the promise resolves. Late resolution notifies `onUpdated`, which schedules another render in `auto` / `continuous` mode.

In `rawRenderPass` (the lowest level) only concrete `UniformValue`s are accepted — the managed `renderPass` is what adds functions and promises.

## Observing changes

| Hook                            | Fires when                                                     |
| ------------------------------- | -------------------------------------------------------------- |
| `pass.onUpdated(cb)`            | a uniform source of that pass changes (`name, value, oldValue`) |
| `glCanvas.onUpdated(cb)`        | a uniform source of the main pass changes                      |
| `glCanvas.onBeforeRender(cb)`   | before the whole chain renders                                 |
| `glCanvas.onAfterRender(cb)`    | after the whole chain has rendered                             |
| `pass.onResize(cb)` / `onInit` / `onDispose` | lifecycle of that pass                            |

## See also

- [Update uniforms at runtime](../essentials/update-uniforms) — the recipes.
- [Shader conventions](./shader-conventions) — how these map to GLSL declarations.
- [API: Types](/api/types/types/) — `UniformValue`, `UniformSource`, `UniformContext`, `Attribute`.
