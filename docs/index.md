---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Radiance
  text: Lightweight, reactive WebGL library
  tagline: A toolkit for building shader-driven experiences.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction/quick-start
    - theme: alt
      text: Examples
      link: /examples/basics/full-screen/
---

## ✨ Simple API

Radiance takes care of the WebGL boilerplate, so you can focus on your shader.

::: example-editor {deps=motion@12}

```ts /index.ts
import { glCanvas, bloom, linearToneMapping } from "@radiancejs/gl";
import fragment from "./cube.frag?raw";
import "./styles.css";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  postEffects: [
    bloom({ radius: 0.5, mix: 0.8 }), //
    linearToneMapping({ exposure: 1 }),
  ],
  uniforms: {
    uCubeSize: 1,
  },
  colorSpace: "display-p3",
});
```

```glsl /cube.frag
varying vec2 vUv; // automatically provided
uniform float uTime; // provided and updated at each frame
uniform vec2 uResolution; // provided and updated when the canvas is resized
uniform float uCubeSize; // uniform set from JS

mat2 rotate2d(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

vec3 rotateCube(vec3 p) {
  p.xz *= rotate2d(uTime * 0.2);
  p.yz *= rotate2d(uTime * 0.1);
  return p;
}

vec2 intersectBox(vec3 ro, vec3 rd, vec3 bounds) {
  vec3 invRd = 1. / rd;
  vec3 t0 = (-bounds - ro) * invRd;
  vec3 t1 = (bounds - ro) * invRd;
  vec3 tMin = min(t0, t1);
  vec3 tMax = max(t0, t1);
  float nearHit = max(max(tMin.x, tMin.y), tMin.z);
  float farHit = min(min(tMax.x, tMax.y), tMax.z);
  return vec2(nearHit, farHit);
}

vec4 sRGBToLinear(vec4 color) {
  return vec4(
    mix(
      color.rgb / 12.92,
      pow((color.rgb + 0.055) / 1.055, vec3(2.4)),
      step(vec3(0.04045), color.rgb)
    ),
    color.a
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - uResolution) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0., 0., 5.);
  vec3 rd = normalize(vec3(uv, -2.));

  vec3 localRo = rotateCube(ro);
  vec3 localRd = rotateCube(rd);
  vec2 hit = intersectBox(localRo, localRd, vec3(uCubeSize));
  vec4 color = vec4(0.);

  if (hit.x < hit.y && hit.y > 0.) {
    float t = max(hit.x, 0.);
    vec3 p = localRo + localRd * t;
    vec3 cubeColor = (p) * 0.5 + 0.5;
    color = vec4(cubeColor, 1.);
  }

  gl_FragColor = sRGBToLinear(color);
}
```

<<< @/snippets/canvas-full/styles.css

<<< @/snippets/default/index.html

:::

## 🪶 Lightweight

The lightest way to render a simple shader, after vanilla WebGL.

<BundleSizeGraph />

## ↺ Reactive

Radiance automatically re-renders the canvas when uniforms are updated, or when the canvas is resized.

::: example-editor {deps=tweakpane@^4.0.5}

<<< ./examples/basics/uniforms/index.ts

<<< ./examples/basics/uniforms/uniforms.frag

<<< @/snippets/canvas-full/styles.css

<<< @/snippets/render-count/index.html

:::

## 🛠️ Fully typed

Radiance provides type-safety for everything, including uniforms.

```ts
const { uniforms } = glCanvas({
  canvas,
  fragment,
  uniforms: {
    uPointer: [0, 0], // [!code highlight]
  },
});

uniforms.uPointer = 42; // Type 'number' is not assignable to type 'number[]'. [!code error]
```

<style scoped>
h2 {
  border-top: 0;
  margin-block: 6rem .5rem;
  font-size: 2.25rem;
}

.ts-code {
  display: flex;
  flex-wrap: wrap;
  column-gap: 1rem;

  > p {
    flex: 3;
    min-width: 320px;
    text-wrap: pretty;
  }
  > div {
    flex: 5;
    min-width: 600px;
  }
}

.language-ts {
  margin: 1rem 0 0 0 !important;
  max-width: 72ch;
}

</style>

<style>
  .is-home {
    .sp-layout {
      border: 0;
    }

    .sp-wrapper {
      --wrapper-width: calc(100svw - 2 * 24px);
      margin-top: 1rem;

      @media (width >= 640px) {
        --wrapper-width: calc(100svw - 2 * 48px);
      }

      @media (width >= 720px) and (orientation: landscape) {
        --wrapper-height: 420px;
        --wrapper-width: 100%;
        --editor-height: 420px;

        .sp-editor {
          border-radius: var(--sp-border-radius) 0 0 var(--sp-border-radius);
        }
      }
    }

    .sp-editor {
      border-radius: var(--sp-border-radius) var(--sp-border-radius) 0 0;

      :root:not(.dark) & {
        border: 1px solid var(--vp-c-divider);
      }
    }
  }

</style>
