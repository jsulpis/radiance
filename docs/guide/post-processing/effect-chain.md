# Chain and order post effects

If one filter is not enough, put several in `postEffects`. They run in array order, each reading the previous output.

```ts
import { bloom, fxaa, glCanvas, hableToneMapping, trails } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uTime: ({ time }) => time / 500 },
  postEffects: [
    trails({ fadeout: 0.25 }), // 1. accumulate motion
    bloom({ radius: 0.5, mix: 0.8 }), // 2. glow
    hableToneMapping({ exposure: 1.2 }), // 3. HDR → display
    fxaa(), // 4. clean up edges
  ],
});
```

## Pick an order

The chain is a signal path, and the usual one is: **stylize → accumulate → glow → tone map → anti-alias**.

| Stage            | Why here                                                             | Effects                                        |
| ---------------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| Stylize          | Operates on the raw scene colors                                     | your own filters, `noise`                      |
| Accumulate       | Needs consecutive frames of the scene                                | `trails`                                       |
| Glow             | Reads bright areas of the accumulated image                          | `bloom`                                        |
| Tone map         | Compresses the HDR result to display range                           | `hableToneMapping`, `acesToneMapping`, …       |
| Anti-alias       | Works on final pixel values; anything after it would soften the fix  | `fxaa`                                         |

Two rules explain most orderings: an effect that **blends with its input** (bloom's combine step, trails' output) wants to see the image as it stands at that point; an effect that **rescales values** (tone mapping) belongs after everything that feeds on brightness. When in doubt, move the effect and watch the render.

## Why the order works at all

Each effect draws into its own floating-point render target and hands that texture to the next one. The compositor creates those targets and wires them up — see [About the rendering pipeline](../concepts/rendering-pipeline). Nothing is copied twice and nothing is lost between stages, which is why HDR maths survives a chain of four passes.

## Mix built-in and custom effects

They are the same kind of object, so the array is flat:

```ts
const grade = effectPass({
  fragment: gradeFragment,
  uniforms: {
    uTexture: ({ inputPass }) => inputPass.target!.texture,
    uContrast: 1.1,
  },
});

postEffects: [grade, bloom(), acesToneMapping({ exposure: 1 })],
```

Custom effects slot in anywhere in the line — see [Write a custom post-processing effect](./custom-effect).

## Control the chain from JavaScript

Keep references and update their uniforms. `bloom` and `trails` expose friendly names (`uRadius`, `uMix`, `uFadeout`, …) that fan out to their sub-passes:

```ts
const bloomEffect = bloom();
const toneMapping = acesToneMapping();

glCanvas({ canvas: "#glCanvas", fragment, postEffects: [bloomEffect, toneMapping] });

bloomEffect.uniforms.uMix = 0.3;
toneMapping.uniforms.uExposure = 1.5;
```

## Group several passes as one effect

`compositeEffectPass` packages several `effectPass` into a single `postEffects` entry, with its own `uniforms` object — that is how `bloom` and `trails` are built. The full recipe, including the `uniforms` forwarding that keeps it reactive, is in [Write a custom post-processing effect](./custom-effect#multiple-passes-in-one-effect).

::: tip Nothing is required
`postEffects` is optional. A chain of zero effects draws the scene straight to the canvas, which is also the cheapest option — see [About performance](../concepts/performance).
:::

## See also

- [Tone map the output](./tone-map-the-output) — choosing the last stage.
- [Built-in effects](../reference/built-in-effects) — every effect and its parameters.
- [Bloom](../../examples/post-processing-builtin/bloom/) — built-in chain with live controls.
