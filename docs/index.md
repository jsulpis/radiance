---
layout: home

hero:
  name: Radiance
  text: Lightweight, reactive WebGL library
  tagline: A small toolkit for fragment shaders, post effects, and GPU simulations.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction/getting-started
    - theme: alt
      text: Examples
      link: /examples/basics/full-screen/
    - theme: alt
      text: Why Radiance
      link: /guide/introduction/why-this-lib
---

<div class="home-content">

<section class="home-intro">

## The canvas sleeps until you touch it

Update a uniform and Radiance schedules a render. Leave it alone and the canvas stays idle. Canvas resize also triggers a render.

[How reactive rendering works →](/guide/concepts/reactive-rendering)

<div class="home-stage">
<div class="home-code">
<div class="home-code__bar"><span>index.ts</span></div>

```ts
import { glCanvas } from "@radiancejs/gl";
import fragment from "./fbmNoise.frag?raw";

const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uWarp: 2.8,
    uLacunarity: 3.2,
    uScale: 1.4,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});

// A change schedules a render
uniforms.uWarp = 3.4;
```

</div>

<HomeUniforms />

</div>

</section>

<section class="home-start home-section">
<div class="home-section__heading">

## Start with a fragment shader

Radiance compiles the program, sets the viewport, provides a default full-screen quad and a per-frame context in uniforms (time, canvas resolution and more).

[Read the setup guide →](/guide/introduction/getting-started)

</div>
<div class="home-code">
<div class="home-code__bar"><span>index.ts</span></div>

```ts
import { glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    void main() {
      vec2 centered = (vUv - 0.5) * uResolution / min(uResolution.x, uResolution.y);
      float radius = 0.2 + sin(uTime) * 0.05;
      float mask = 1.0 - smoothstep(radius - 0.01, radius, length(centered));
      gl_FragColor = vec4(vec3(mask), 1.0);
    }
  `,
  uniforms: {
    uTime: ({ time }) => time / 1000,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});
```

</div>
</section>

<section class="home-pipeline">
<div class="home-pipeline__heading">

## Make it shine with effects

Chain built-in effects or write your own with a single function. Effect uniforms update the same way shader uniforms do, and each change schedules a render.

[Explore built-in effects →](/examples/post-processing-builtin/bloom/)

</div>
<div class="home-stage">
<div class="home-code">
<div class="home-code__bar"><span>index.ts</span></div>

```ts
import { bloom, ditherHalftone, glCanvas, hableToneMapping } from "@radiancejs/gl";
import fragment from "./gradient.frag?raw";

glCanvas({
  canvas: canvas.value!,
  fragment,
  uniforms: {
    uTime: ({ time }) => time / 1000,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
  postEffects: [
    bloom({ radius: 0.6 }),
    hableToneMapping({ exposure: 2, outputColorSpace: "linear" }),
    ditherHalftone({ size: 6 }),
  ],
});
```

</div>

<HomeBloom />

</div>
</section>

<section class="home-beyond">
  <div class="home-beyond__content">
<div class="home-beyond__intro">

## Past the full-screen quad

Go further with your own geometry, object instances, render into framebuffers, and run simulations on the GPU.

</div>
<div class="home-beyond__links">
  <a href="/examples/gpgpu/particles/"><strong>Build a stateful particle system</strong><span aria-hidden="true">→</span></a>
  <a href="/examples/gpgpu/boids/"><strong>Run a boids simulation</strong><span aria-hidden="true">→</span></a>
  <a href="/examples/basics/instancing/"><strong>Draw instanced objects</strong><span aria-hidden="true">→</span></a>
</div>

  </div>
</section>

<section class="home-details">
<div>

## Small by design

Radiance stays close to WebGL without the weight (and features) of a full 3D engine. This comparison measures a single full-screen shader built with various libraries.

<BundleSizeGraph />

</div>
<div class="home-details__types">

## Typed uniforms

Types are inferred from the values you pass, so an update that does not match is a compile error.

[Browse the API →](/api/)

<div class="home-code">
<div class="home-code__bar"><span>index.ts</span></div>

```ts
const { uniforms } = glCanvas({
  canvas,
  fragment,
  uniforms: {
    uPointer: [0, 0], // [!code highlight]
  },
});

uniforms.uPointer = 42; // Type 'number' is not assignable to type '[number, number]'. [!code error]
```

</div>

</div>
</section>

<section class="home-end">

## Write your first shader

[Get started →](/guide/introduction/getting-started)

<p class="home-end__example">Or edit the <a href="/examples/basics/full-screen/">interactive examples</a>.</p>

</section>

</div>

<style>
/* Hero */
.VPContent.is-home .VPHomeHero {
  .name {
    color: #a9c7ff;
    background: none;
    -webkit-text-fill-color: currentColor;
  }

  .text {
    max-width: 650px;
    font-size: clamp(2.125rem, 3.2vw, 3.36rem);
    line-height: 1.08;
    letter-spacing: -.045em;

    @media (min-width: 960px) {
      font-size: 3.36rem;
    }
  }

  .tagline {
    max-width: 440px;
    font-size: 1.125rem;
    line-height: 1.6;
  }

  .actions {
    padding-top: 30px;
  }
}

/* Markdown defaults within the home page */
.home-content {
  color: var(--vp-c-text-1);
}

.vp-doc .home-content {
  h2 {
    margin: 0;
    border: 0;
    padding: 0;
    font-size: clamp(1.875rem, 3.2vw, 2.625rem);
    line-height: 1.12;
    letter-spacing: -.035em;

    .header-anchor {
      top: 0;
    }
  }

  p {
    max-width: 60ch;
    color: #aab8ca;
    line-height: 1.7;
  }

  a {
    color: #a9c7ff;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      color: white;
    }
  }

  div[class*='language-'] > span.lang {
    display: none;
  }

  .home-code div[class*='language-'] {
    margin: 0;
    border-radius: 0;
    background: transparent;
  }

  .home-code pre {
    padding: 22px 0;
  }

  .home-code code {
    font-size: 0.75rem;
    line-height: 1.8;
  }

  /* Closing block sits tight and centers its content */
  .home-end {
    > h2 {
      width: fit-content;
      margin-inline: auto;
    }

    > p {
      max-width: none;
      margin: 32px 0 0;
    }

    > p:not(.home-end__example) a {
      display: inline-block;
      padding: 12px 22px;
      border-radius: 6px;
      background: #a9c7ff;
      color: #08111e;

      &:hover {
        background: #d3e2ff;
        color: #08111e;
      }
    }

    > p.home-end__example {
      margin: 18px 0 0;
      font-size: 0.875rem;

      a {
        display: inline;
        padding: 0;
        border-radius: 0;
        background: none;
        color: #a9c7ff;
        font-weight: 400;
        text-decoration: underline;
        text-underline-offset: 3px;

        &:hover {
          background: none;
          color: white;
        }
      }
    }
  }
}

/* Section headings override the home defaults */
.vp-doc .home-details h2 {
  margin: 0;
  border: 0;
  padding: 0;
  font-size: 1.875rem;
  line-height: 1.1;
  letter-spacing: -.04em;
}

/* Shared rhythm for intro paragraphs */
.home-intro > p,
.home-section__heading p,
.home-pipeline__heading p,
.home-details p {
  margin: 18px 0 24px;
}

/* Sections */
.home-intro {
  padding: 60px 0 120px;
  border-bottom: 1px solid #25303d;

  .home-stage > .home-code {
    align-self: stretch;
  }

  @media (max-width: 719px) {
    padding: 32px 0 80px;
  }
}

.home-section {
  display: grid;
  grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr);
  gap: clamp(36px, 8vw, 100px);
  align-items: center;
  padding: 120px 0;
  border-bottom: 1px solid #25303d;

  @media (max-width: 719px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 80px 0;
  }
}

.home-pipeline {
  padding: 120px 0;
  border-bottom: 1px solid #25303d;

  .home-pipeline__heading {
    max-width: 65ch;
    margin-bottom: 44px;
  }

  @media (max-width: 719px) {
    padding: 80px 0;
  }
}

.home-beyond {
  padding: 120px 0;
  border-bottom: 1px solid #25303d;

  .home-beyond__content {
    display: grid;
    grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr);
    gap: clamp(36px, 8vw, 120px);
    align-items: center;

    @media (max-width: 719px) {
      grid-template-columns: 1fr;
      gap: 32px;
    }
  }

  .home-beyond__intro p {
    margin: 18px 0 0;
  }

  .home-beyond__links {
    @media (max-width: 719px) {
      margin-top: 0;
    }

    a {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 20px;
      padding: 20px 0;
      border-bottom: 1px solid #344355;
      color: #e8eef8;
      font-weight: 400;

      &:first-child {
        border-top: 1px solid #344355;
      }

      &:hover strong {
        color: #a9c7ff;
      }

      span {
        color: #a9c7ff;
        font-size: 1.25rem;
      }
    }
  }

  @media (max-width: 719px) {
    padding: 80px 0;
  }
}

.home-details {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: clamp(40px, 7vw, 100px);
  padding: 120px 0;
  border-bottom: 1px solid #25303d;

  .home-details__types {
    min-width: 0;

    div[class*='language-'] {
      margin: 0;
      overflow-x: auto;
    }
  }

  @media (max-width: 719px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 80px 0;
  }
}

/* Code blocks */
.home-code {
  overflow: hidden;
  min-width: 0;
  border: 1px solid #2a3442;
  border-radius: 8px;
  background: #0c1118;

  .home-code__bar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 24px;
    border-bottom: 1px solid #2a3442;
    color: #aab8ca;
    font: 0.625rem/1.4 var(--vp-font-family-mono);
    letter-spacing: .1em;
  }
}

.home-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 20px;

  .home-code {
    align-self: start;
  }

  @media (max-width: 719px) {
    grid-template-columns: 1fr;
  }
}

/* Closing block */
.home-end {
  padding: 120px 0 80px;
  text-align: center;

  @media (max-width: 719px) {
    padding: 80px 0 40px;
  }
}
</style>
