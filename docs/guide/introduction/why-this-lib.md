# Why this lib?

There are many great WebGL libraries out there, most of which are designed to help you build full 3D applications: they provide a scene graph, a camera system, and a renderer that can handle multiple objects, lights, and materials.

These libraries are great for building games or interactive 3D experiences, but they can be overkill when you just want to render a single shader to the screen. This leads to a lot of boilerplate code, unnecessary complexity, and performance overhead because you ship the code for features you don't need.

Radiance is designed precisely for that use case: working with WebGL shaders. If all you want is to write a fragment shader for [ray tracing](../../examples/use%20cases/ray%20tracing/), or play with [particles](../../examples/basics/particles/) with a vertex shader, Radiance should be the easiest way to do that.

## What is Radiance ?

Radiance is a lightweight, reactive WebGL2 library for building shader-driven experiences. It focuses on ease of use, taking care of the repetitive parts of WebGL setup while keeping your shader source and rendering pipeline close to the native API.

### Layered approach

Radiance provides a gradual path from a single fragment shader to a more involved GPU pipeline:

- Render a [full-screen fragment shader](../../examples/basics/full-screen/) with a minimal setup.
- Provide a [vertex shader and custom attributes](../../examples/basics/drawing-modes/) to render geometry or particles.
- Add [post-processing effects](../../examples/post-processing-builtin/bloom/) (built-in or write your own) for more polished visuals.
- Use [ping-pong framebuffers](../../examples/gpgpu/boids/) and [transform feedback](../../examples/gpgpu/maths/) to implement GPU simulations.

Radiance stays close to the native WebGL API, so if you know it already, you should have an idea of how the primitives work.

### Reactive rendering

Radiance automatically re-renders the canvas when [uniforms are updated](../../examples/basics/uniforms/) or [the canvas is resized](../../examples/basics/resize/). This allows to avoid a naive render loop that runs at a fixed frame rate, and instead only render when necessary. This is especially useful for static images or when the user is not interacting with the canvas.

### Reduced boilerplate

Radiance helps you provide the time and canvas resolution uniforms without having to update them manually.

Helpers are also provided to handle common [pointer interactions](../../examples/interactions/pointer/), use the animation loop etc.

## What is it not ?

### A full 3D engine

Radiance does not provide the systems that are useful when an application is built around a conventional 3D scene:

- No scene graph for organizing objects and their transforms.
- No built-in camera, lighting, or material system.
- No model loader, animation system, physics engine, or 3D asset workflow.

Basically if you want to display a 3D model, while it's technically possible to do it with Radiance, you may want to consider using one of the alternatives listed below.

### Battle-tested

Radiance is a relatively new library, and is nowhere near as mature as the more established 3D engines. It is still evolving, and some features may be missing or incomplete. There is also no support for WebGL1, for which most older libraries have a fallback path.

## Alternatives

If you need a more mature library, you may want to consider one of the following alternatives:

- [three.js](https://threejs.org/) is the most popular WebGL library with the largest community, and provides a complete 3D engine with a scene graph, camera system, and basically everything you could think of (at the cost of a much greater weight).
- [four](https://github.com/CodyJasonBennett/four) sits nicely in the spot where you need some basic functionalities like perspective, multiple objects or load external files, but don't need the full power of three.js, while being extremely lightweight.
- [OGL](https://github.com/oframe/ogl) slightly lower level than four but offers features like built-in meshes and an API to do your own post-processing effects.
- [twgl.js](https://twgljs.org/) makes the native WebGL API less verbose, so you have to implement everything yourself but with less boilerplate code than vanilla WebGL.

### Features comparison

<small>_biased, of course_</small>

| Feature                 | Radiance | three.js | four | OGL | twgl.js |
| ----------------------- | -------- | -------- | ---- | --- | ------- |
| Scene Graph / Camera    | 🟧       | ✅       | ✅   | ✅  | 🟧      |
| Object Loader           | 🟧       | ✅       | 🟧   | ✅  | 🟧      |
| Built-in Meshes         | 🟧       | ✅       | 🟧   | ✅  | 🟧      |
| Post-processing effects | ✅       | ✅       | 🟧   | 🟧  | 🟧      |
| GPGPU                   | ✅       | ✅       | ✅   | ✅  | 🟧      |
| Automatic canvas resize | ✅       | 🟧       | 🟧   | 🟧  | 🟧      |
| Reactive updates        | ✅       | ❌       | ❌   | ❌  | 🟧      |
| Lightweight             | ✅       | ❌       | ✅   | ✅  | ✅      |
| Concise API for shaders | ✅       | ❌       | ❌   | ❌  | ❌      |

✅ built-in <br/>
🟧 the lib doesn't include it but you can build it yourself <br/>
❌ not available
