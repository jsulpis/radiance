# About the rendering pipeline

Radiance is built from render passes that feed each other. This page describes that graph, the job of each piece, and which layer of the API to reach for.

## The pass graph

Every draw is a **pass**: a program (vertex + fragment shader), its uniforms, its attributes, and the render target it writes to. Passes compose into a small graph:

```
                         ┌────────────────────────┐
                         │  main render pass      │
                         │  (your shader)         │
                         └───────────┬────────────┘
                                     │ texture
                        ┌────────────▼────────────┐
                        │  effect pass 1          │
                        │  (e.g. bloom, sepia)    │
                        └───────────┬─────────────┘
                                    │ texture
                        ┌───────────▼─────────────┐
                        │  effect pass 2          │
                        │  (e.g. tone mapping)    │
                        └───────────┬─────────────┘
                                    │
                            ┌───────▼───────┐
                            │    canvas     │
                            └───────────────┘
```

Each arrow is a **render target** — a framebuffer with a texture attached. A pass draws into a texture instead of the screen whenever something else needs to read the result. The compositor creates those intermediate targets automatically when you pass `postEffects`, in floating-point RGBA so the values survive HDR maths.

The last effect writes to the canvas. With no `postEffects`, the main pass writes to the canvas directly.

## The pieces

| Building block                           | Job                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `createShader` / `createProgram`         | Compile and link GLSL (with [automatic GLSL 3.00 conversion](../reference/shader-conventions)) |
| `setAttribute`                           | Upload vertex data and bind it to a shader input                                               |
| `createRenderTarget` / `setRenderTarget` | Offscreen framebuffer + texture, and the bind/clear helper                                     |
| `rawRenderPass`                          | One draw call: shaders, concrete uniforms, attributes, target                                  |
| `renderPass`                             | A pass whose uniforms can also be promises and functions (resolved before each draw)           |
| `quadRenderPass`                         | A pass that draws a single full-screen triangle — the geometry of shaders and effects          |
| `effectPass`                             | A `quadRenderPass` that owns a floating-point target, ready to slot into a chain               |
| `compositeEffectPass`                    | Several effect passes packaged as one effect (this is what `bloom` and `trails` are)           |
| `compositor`                             | The chain itself: orders passes, creates intermediate targets, wires effect inputs             |
| `glContext`                              | Resolves the canvas and creates the WebGL2 context                                             |
| `glCanvas`                               | Assembles all of the above into a managed canvas                                               |

## What `glCanvas` assembles

`glCanvas` is the high-level entry point. Calling it builds the whole graph and wires the lifecycle around it:

1. **Context** — `glContext` finds the canvas (CSS selector, element or `OffscreenCanvas`) and creates a WebGL2 context. If you passed `colorSpace`, it is applied to the drawing buffer here.
2. **Scene pass** — a `quadRenderPass` with your `fragment` shader and the built-in full-screen vertex shader (a single large triangle, with a `vUv` varying adapted to whatever your fragment declares). Whatever `attributes` you pass are attached to it.
3. **Compositor** — `compositor({ renderPass, postEffects })` initializes every pass against the same context and creates the intermediate float targets described above.
4. **Resize handling** — unless the canvas already has `width`/`height` attributes (or is an `OffscreenCanvas`), a `ResizeObserver` keeps the drawing buffer in sync with the CSS size × `dpr`, and calls `setSize` on every pass and target.
5. **Render scheduling** — uniform updates are turned into frame requests (see [About reactive rendering](./reactive-rendering)).
6. **Clock** — in `continuous` mode, a `loop` feeds `time`, `deltaTime` and `elapsedTime` to uniform functions.

The returned object exposes the whole thing: `uniforms` (the scene pass), `render`, `play`/`pause`, `setSize`, `onBeforeRender`/`onAfterRender`, and `dispose` to tear it all down.

## How effects see the rest of the chain

Effect uniforms are regular [uniform sources](../reference/uniform-sources), with two extra fields in their context:

| Context field  | Meaning                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `inputPass`    | The pass rendered before this effect started (for a single-pass effect: the scene pass)           |
| `previousPass` | The pass rendered immediately before this one (inside a multi-pass effect, the previous sub-pass) |

That is how an effect reads the image it is processing:

```ts
const sepia = effectPass({
  fragment: /* glsl */ `
    uniform sampler2D uTexture;
    in vec2 vUv;
    out vec4 fragColor;

    void main() {
      fragColor = texture(uTexture, vUv); // ← the previous pass' render target
    }
  `,
  uniforms: {
    uTexture: ({ inputPass }) => inputPass.target!.texture,
  },
});
```

`bloom` uses both: `inputPass` for the original scene it combines with its glow, and `previousPass` to chain its downsampling sub-passes.

## Which layer to reach for

Radiance is deliberately layered. Start at the top and drop down only when the layer above is in your way.

| You are building…                                      | Use                                                       |
| ------------------------------------------------------ | --------------------------------------------------------- |
| A full-screen shader, with optional post effects       | `glCanvas`                                                |
| A simulation or a custom frame loop, still on a canvas | `glContext` + `pingPongFBO` / `renderPass` / `compositor` |
| Geometry with your own attributes and draw modes       | `glContext` + `renderPass`                                |
| Something the pass abstraction does not fit            | `createProgram`, `createRenderTarget`, `rawRenderPass`    |

The GPGPU helpers sit beside this ladder rather than on it: [`pingPongFBO`](../gpgpu/ping-pong-simulations) is a `quadRenderPass` that swaps its own targets, and [`transformFeedback`](../gpgpu/transform-feedback) is a `renderPass` that captures varyings into buffers. See [About GPU computation](./gpgpu) for how they compare.

## Ownership and lifetime

- The compositor owns the intermediate targets and disposes them with `dispose()`.
- An `effectPass` owns its target unless you passed `target` yourself.
- `glCanvas` owns everything it created: the compositor, the resize observer, and the clock. One `dispose()` releases it all — which is what UI framework teardown should call (see [Mount and unmount in a UI framework](../advanced/mount-in-a-ui-framework)).

## See also

- [About reactive rendering](./reactive-rendering) — when this graph is executed.
- [Write a custom post-processing effect](../post-processing/custom-effect) — the effect pass contract in practice.
- [Chain and order post effects](../post-processing/effect-chain) — building longer chains.
- [Shader conventions](../reference/shader-conventions) — what the default vertex shader provides.
- [API: Passes](/api/passes/) — signatures of every pass factory.
