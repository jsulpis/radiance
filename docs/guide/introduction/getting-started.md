# Getting Started

## Installation

Install the package as a runtime dependency:

::: code-group

```sh [npm]
npm install @radiancejs/gl
```

```sh [pnpm]
pnpm add @radiancejs/gl
```

```sh [yarn]
yarn add @radiancejs/gl
```

```sh [bun]
bun add @radiancejs/gl
```

:::

## Setup

### Add an HTML Canvas

Add a canvas to the page where the shader should appear. You can use an id to select it later in JavaScript.

```html
<canvas id="glCanvas"></canvas>
```

::: info Canvas resolution

Be careful not to set the `width` and `height` attributes on the canvas, as Radiance will set these attributes using the canvas CSS size and the device pixel ratio, and update them automatically when the canvas is resized. But they won't be touched if they are already set.

:::

The canvas size is controlled with CSS, which allows responsive sizing. This example fills the viewport:

```css
html,
body {
  margin: 0;
  min-height: 100%;
}

#glCanvas {
  display: block;
  width: 100dvw;
  height: 100dvh;
}
```

### Render a Fragment Shader

Create a JavaScript or TypeScript module that runs after the canvas is in the
document. Use the high-level `glCanvas` function to create a WebGL2 context, compile a fragment shader, and render it to the canvas. The following example draws a circle with a color gradient.

```ts
import { glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas", // CSS selector for the canvas
  fragment: /* glsl */ `
    varying vec2 vUv; // provided by the default vertex shader
    uniform vec2 uResolution;
    uniform float uTime;
    #define RADIUS .2

    void main() {
      vec2 center = uResolution / 2.;
      float dist = distance(vUv * uResolution, center);
      float radiusPx = min(uResolution.x, uResolution.y) * RADIUS;
      float circleMask = 1. - smoothstep(radiusPx * .99, radiusPx * 1.01, dist);
      vec2 circleUv = (vUv * uResolution - center) / radiusPx;
      vec3 color = vec3((circleUv + 1.) * .5, sin(uTime) / 2. + .5) * circleMask;
      gl_FragColor = vec4(color, 1.);
    }
  `,
  uniforms: {
    uTime: ({ time }) => time / 500, // tweak the speed of the animation here
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});
```

Here is the expected result:

::: example-editor

```ts /index.ts
import { glCanvas } from "@radiancejs/gl";
import "./styles.css";

glCanvas({
  canvas: "#glCanvas", // CSS selector for the canvas
  fragment: /* glsl */ `
    varying vec2 vUv; // provided by the default vertex shader
    uniform vec2 uResolution;
    uniform float uTime;
    #define RADIUS .2

    void main() {
      vec2 center = uResolution / 2.;
      float dist = distance(vUv * uResolution, center);
      float radiusPx = min(uResolution.x, uResolution.y) * RADIUS;
      float circleMask = 1. - smoothstep(radiusPx * .99, radiusPx * 1.01, dist);
      vec2 circleUv = (vUv * uResolution - center) / radiusPx;
      vec3 color = vec3((circleUv + 1.) * .5, sin(uTime) / 2. + .5) * circleMask;
      gl_FragColor = vec4(color, 1.);
    }
  `,
  uniforms: {
    uTime: ({ time }) => time / 500, // tweak the speed of the animation here
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});
```

<<< @/snippets/canvas-full/styles.css

<<< @/snippets/default/index.html

:::

## What happened

- `glCanvas` includes default attributes and a vertex shader that provides the `vUv` varying and renders a quad that covers the entire canvas.
- It creates the WebGL2 context, compiles the shaders and links the program, sets-up the uniforms and attributes, and draws the quad to the canvas.
- It measures and tracks the canvas size using a `ResizeObserver` which allows to provide the `uResolution` uniform to the shader. It also starts a render loop to provide the `uTime` uniform to the shader.

## Try some changes

Be creative and try some changes to the fragment shader. For example, you can use the `uTime` uniform to animate the radius of the circle:

```glsl
    #define RADIUS .2 * (sin(uTime) / 4. + 1.)
```

You already have the tools to create advanced animations using just a fragment shader and a few uniforms. A lot of what you can find on [Shadertoy](https://www.shadertoy.com/) doesn't need more than that.
