# About GPU computation

GPUs are not only for drawing pictures. The same fragment shader that paints a pixel can compute one number, and with the right buffer management the result feeds the next computation instead of the screen. Radiance ships two building blocks for that — `pingPongFBO` and `transformFeedback`. This page is about choosing between them.

## State that lives on the GPU

The pattern behind every GPU simulation is the same: state is data in GPU memory, a step is a full-screen (or per-vertex) draw that reads the previous state and writes the next, and the CPU only orchestrates. Nothing is downloaded between steps.

That is what makes a million particles cheap: they are a texture (or a buffer), and "updating all of them" is one draw call whose cost is spread over the whole GPU.

```
   ┌────────────────┐  render()   ┌────────────────┐
   │  state (read)  │ ──────────► │  state (write) │ ─┐
   └────────────────┘             └────────────────┘  │ swap
          ▲                                            │
          └────────────────────────────────────────────┘
```

## Two shapes of state

The two helpers differ in how they hold the state, and that decides which one to use.

|                                   | `pingPongFBO`                          | `transformFeedback`                    |
| --------------------------------- | -------------------------------------- | -------------------------------------- |
| State shape                       | an image (one texel per element)       | a stream (one vertex per record)       |
| Step                              | a fragment shader per texel            | a vertex shader per vertex             |
| Output                            | a texture (`pass.texture`)             | buffers (`outputBuffers`, `getOutputData`) |
| Addressing                        | sample by UV or `texelFetch`           | by vertex index                        |
| Extra fields per element          | any number of channels in the texel    | any number of output varyings          |
| Reads well from                   | other fragment shaders                 | other vertex shaders / the CPU         |

**Reach for `pingPongFBO`** when neighbors matter (cellular automata, fluids, anything that samples around a coordinate), when the state is naturally a field, or when you want to display the state by simply sampling it.

**Reach for `transformFeedback`** when the state is a list of records (particles, agents, matrix rows), when a vertex shader already computes what you need, or when the CPU needs the numbers back.

Both are documented as recipes: [Run a simulation with ping-pong framebuffers](../gpgpu/ping-pong-simulations) and [Capture vertex output with transform feedback](../gpgpu/transform-feedback).

## The ping-pong idea

A shader cannot read and write the same texture in one draw — the result would depend on rasterization order. So two targets are kept and swapped: read `A`, write `B`, swap, read `B`, write `A`. `pingPongFBO` owns both and does the swap at the end of each `render()`.

That costs twice the memory of the state and one extra pointer swap. Memory is usually the binding constraint: state is held in RGBA32F (4 floats per element), so a 1024×1024 field is 16 MB per target, 32 MB total.

## The transform feedback idea

Transform feedback is a WebGL2 feature that captures the `out` varyings of a vertex shader into buffers, with rasterization disabled. Nothing is drawn; the values land in GPU buffers you can read (`getOutputData`) or bind as attributes of the next pass.

The cost is one buffer per output and a sync point whenever the CPU reads back. Keep results on the GPU between steps — a `getOutputData` call stalls the pipeline.

## Precision, and when the CPU wins

Float32 state drifts. Positions that integrate velocity lose sub-millimeter precision as they grow; counters past ~16 million stop incrementing. Wrap coordinates, renormalize, or use the [Maths](../../examples/gpgpu/maths/) comparison to check whether your workload even benefits from the GPU.

That example multiplies matrices on both sides and shows the honest trade-off: for small data, the CPU wins because it avoids the round trip. The GPU wins when the data is large, the work per element is heavy, and the result stays on the GPU.

A rough decision guide:

| Workload                                          | Where it belongs              |
| ------------------------------------------------- | ----------------------------- |
| < ~10k simple updates per frame                   | CPU                           |
| Large fields with neighbor reads (fluids, GoL)    | `pingPongFBO`                 |
| Large streams of independent records              | `transformFeedback`           |
| Anything that must be displayed anyway            | GPU — the display is free     |
| Results the CPU needs every frame                 | CPU, or GPU with a budget     |

## Simulate and display separately

A simulation texture is not a picture. The usual arrangement is two pipelines over one context: a `pingPongFBO` (or `transformFeedback`) that steps, and a `glCanvas` or `renderPass` that draws the result.

```ts
loop(({ deltaTime }) => {
  positions.uniforms.uDeltaTime = deltaTime / 500;
  positions.render(); // step the simulation
  display.render(); // then show it
});
```

The display samples `simulation.texture` through a function uniform, and can use `simulation.coords` to place one vertex per element — the same split [GPGPU particles](../../examples/gpgpu/particles/) extends with velocities and blending.

## See also

- [About the rendering pipeline](./rendering-pipeline) — the pass machinery these helpers sit on.
- [About performance](./performance) — what GPGPU costs in memory and time.
- [Run a simulation with ping-pong framebuffers](../gpgpu/ping-pong-simulations), [Capture vertex output with transform feedback](../gpgpu/transform-feedback).
- [Game of Life](../../examples/gpgpu/game-of-life/), [Particles](../../examples/gpgpu/particles/), [Boids](../../examples/gpgpu/boids/), [Maths](../../examples/gpgpu/maths/).
