# Radiance

[![npm version](https://img.shields.io/npm/v/%40radiancejs%2Fgl?logo=npm&label=npm)](https://npmx.dev/package/@radiancejs/gl)
[![CI](https://github.com/jsulpis/radiance/actions/workflows/ci.yml/badge.svg)](https://github.com/jsulpis/radiance/actions/workflows/ci.yml)
[![Lib Bundle Size (gzip)](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdeno.bundlejs.com%2F%3Fq%3D%40radiancejs%2Fgl&query=%24.size.compressedSize&style=flat&label=full%20(gzip)>)](https://bundlejs.com/?q=@radiancejs/gl&treeshake=%5B*%5D)
[![glCanvas Size (gzip)](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdeno.bundlejs.com%2F%3Fq%3D%40radiancejs%2Fgl%26treeshake%3D%255B%257BglCanvas%257D%255D&query=%24.size.compressedSize&style=flat&label=glCanvas%20(gzip)>)](https://bundlejs.com/?q=@radiancejs/gl&treeshake=%5B%7BglCanvas%7D%5D)
[![license](https://img.shields.io/github/license/jsulpis/radiance)](https://github.com/jsulpis/radiance/blob/main/LICENSE)

Lightweight, reactive WebGL2 library for building shader-driven experiences.

Radiance removes repetitive WebGL setup while keeping the shader and rendering
pipeline close to the native API. Use the high-level canvas API for a quick start,
or compose render passes, render targets, textures, and GPU simulations directly.

**[Documentation](https://radiancejs.dev)** · **[Examples](https://radiancejs.dev/examples/basics/full-screen/)** · **[API reference](https://radiancejs.dev/api/)** · **[Changelog](https://github.com/jsulpis/radiance/blob/main/lib/CHANGELOG.md)**

## Features

- Reactive, fully typed uniforms and automatic rendering
- WebGL2 canvas setup with resize and device-pixel-ratio handling
- Full-screen shader rendering with a minimal API
- Composable render, effect, composite-effect, and post-processing passes
- Built-in bloom, trails, and tone-mapping effects
- Image, video, data, and floating-point textures
- Ping-pong framebuffers and transform feedback for GPGPU workflows
- Pointer events, animation loops, and OffscreenCanvas support
- ESM distribution with generated TypeScript declarations

## Installation

```sh
npm install @radiancejs/gl
```

```sh
pnpm add @radiancejs/gl
```

```sh
yarn add @radiancejs/gl
```

```sh
bun add @radiancejs/gl
```

Radiance uses WebGL2. Make sure the browser or runtime where it runs provides
a WebGL2-capable canvas.

## Quick Start

Add a canvas to your page:

```html
<canvas id="glCanvas"></canvas>
```

Then render a full-screen shader:

```ts
import { glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 vUv; // provided by the default vertex shader
    uniform float uTime;
    uniform vec2 uResolution;

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
      vec3 color = 0.5 + 0.5 * cos(uTime + uv.xyx + vec3(0.0, 2.0, 4.0));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    uTime: ({ time }) => time / 500,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});
```

An animation loop is started if a time uniform is detected. Uniforms are reactive, so changing a value schedules a render:

```ts
const canvas = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uColor: [1, 0.2, 0.1],
  },
});

canvas.uniforms.uColor = [0.2, 0.8, 1];
```

## Post-processing

Pass built-in effects to `postEffects`, or create your own effect passes with
`effectPass` and `compositor`:

```ts
import { bloom, glCanvas, hableToneMapping, trails } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  postEffects: [
    bloom({ radius: 0.5, mix: 0.8 }),
    trails({ fadeout: 0.25 }),
    hableToneMapping({ exposure: 1.2 }),
  ],
});
```

## GPU Computation

Radiance includes building blocks for GPU simulations such as particles,
boids, fluid-like effects, and cellular automata. `pingPongFBO` swaps textures
between frames, while `transformFeedback` captures vertex shader outputs in
buffers.

```ts
import { glContext, pingPongFBO } from "@radiancejs/gl";

const { gl } = glContext({ canvas: "#glCanvas" });

const simulation = pingPongFBO({
  gl,
  fragment: simulationFragment,
  dataTexture: {
    name: "tState",
    initialData: new Float32Array(initialState),
  },
  uniforms: {
    uDeltaTime: 0,
  },
});

simulation.uniforms.uDeltaTime = 1 / 60;
simulation.render();
```

See the [GPGPU examples](https://radiancejs.dev/examples/gpgpu/boids/) for
complete simulations.

## API Overview

The package exports low-level and high-level primitives from one entry point:

- **Canvas and context:** `glCanvas`, `glContext`
- **Rendering:** `renderPass`, `quadRenderPass`, `compositor`
- **Effects:** `effectPass`, `compositeEffectPass`, `bloom`, `trails`, tone mapping
- **GPU computation:** `pingPongFBO`, `transformFeedback`
- **Resources:** `createProgram`, `createShader`, render targets, attributes, textures
- **Helpers:** `loop`, `onResize`, `onPointerEvents`

Browse the [API reference](https://radiancejs.dev/api/) or start with the
[quick-start guide](https://radiancejs.dev/guide/introduction/quick-start).

## Browser Support

Radiance targets environments with WebGL2 support. Features that use browser
APIs such as `HTMLVideoElement`, `ImageBitmap`, pointer events, or
`OffscreenCanvas` depend on the runtime providing those APIs.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/jsulpis/radiance).
Please include a focused description of the change and, where relevant, an
example or regression test.

## License

[MIT](https://github.com/jsulpis/radiance/blob/main/LICENSE) ©
[Julien SULPIS](https://github.com/jsulpis).
