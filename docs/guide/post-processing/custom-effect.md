# Write a custom post-processing effect

If you want a filter the library does not ship, create an `effectPass`: a full-screen shader that samples the previous pass and writes a color.

```ts
import { effectPass } from "@radiancejs/gl";

const sepia = effectPass({
  fragment: /* glsl */ `
    uniform sampler2D uTexture;
    uniform float uStrength;
    in vec2 vUv;
    out vec4 fragColor;

    vec3 sepia(vec3 c) {
      return c * mat3(
        0.393, 0.769, 0.189,
        0.349, 0.686, 0.168,
        0.272, 0.534, 0.131
      );
    }

    void main() {
      vec4 color = texture(uTexture, vUv);
      fragColor = vec4(mix(color.rgb, sepia(color.rgb), uStrength), color.a);
    }
  `,
  uniforms: {
    uTexture: ({ inputPass }) => inputPass.target!.texture,
    uStrength: 1,
  },
});

glCanvas({
  canvas: "#glCanvas",
  fragment,
  postEffects: [sepia],
});
```

## The contract

| Piece              | What it is                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| Geometry           | A full-screen quad — `effectPass` draws it; a `vertex` shader is optional     |
| `uTexture`         | Your sampler for the previous stage, wired to `inputPass.target.texture`     |
| `vUv`              | Texture coordinates of the quad, 0 to 1 across the target                    |
| `fragColor`        | The output color (`out vec4 fragColor`, or `gl_FragColor` in GLSL 1.00 style) |
| Context            | `inputPass` and `previousPass`, plus the usual frame context                 |

`inputPass` is the pass rendered before the effect started — the scene, for a single-pass effect. `previousPass` is the pass immediately before this one, which differs inside a multi-pass effect. See [About the rendering pipeline](../concepts/rendering-pipeline#how-effects-see-the-rest-of-the-chain).

## Own your uniforms

Effect uniforms are ordinary [uniform sources](../reference/uniform-sources) and stay reactive after the effect is created:

```ts
sepia.uniforms.uStrength = 0.2; // schedules a render
```

Bind them to a UI like any other pass — that is all the [Single pass](../../examples/post-processing/single-pass/) example does with its strength slider.

Function uniforms also get `passResolution`, the size of the target this pass draws into. Use it for texel-sized maths (blur radii, edge detection):

```ts
uniforms: {
  uTexelSize: ({ passResolution }) => [1 / passResolution[0], 1 / passResolution[1]],
}
```

## Multiple passes in one effect

When the filter needs an intermediate step (blur, downsample, detect-then-combine), build it from several `effectPass` and package them with `compositeEffectPass`:

```ts
import { compositeEffectPass, effectPass } from "@radiancejs/gl";

const horizontalBlur = effectPass({ fragment: blurFragment, uniforms: { /* … */ } });
const verticalBlur = effectPass({
  fragment: blurFragment,
  uniforms: {
    uTexture: () => horizontalBlur.target!.texture, // ← explicit hand-off
    // …
  },
});
const combine = effectPass({
  fragment: combineFragment,
  uniforms: {
    uBaseImage: ({ inputPass }) => inputPass.target!.texture, // the scene
    uBloomTexture: ({ previousPass }) => previousPass.target!.texture, // the blur
    uMix: 1,
  },
});

const glow = compositeEffectPass({
  passes: [horizontalBlur, verticalBlur, combine],
  uniforms: {
    get uMix() {
      return combine.uniforms.uMix;
    },
    set uMix(v) {
      combine.uniforms.uMix = v; // forwards to the reactive pass → schedules a render
    },
  },
});
```

A composite effect's `uniforms` is a plain object that nothing observes — the getters and setters above forward to `combine`, whose reactive uniforms do schedule a render. This is exactly how `bloom` and `trails` expose `uRadius`, `uMix` and `uFadeout`.

Inside the composite, `previousPass` walks the sub-passes while `inputPass` keeps pointing at the scene — that is how `combine` reads both. `bloom` and `trails` are built this way; [Multi pass](../../examples/post-processing/multi-pass/) is the readable version.

## Render targets

By default an effect owns a half-float RGBA target sized like the canvas, disposed with the effect. Override when you need something else:

```ts
effectPass({
  fragment,
  uniforms,
  resolutionScale: 0.5, // half-res target: cheaper blur-ish effects
  targetParams: { width: 256, height: 256, internalFormat: … },
});
```

Pass `target: someRenderTarget` to render into a target you own (and dispose) yourself.

## See also

- [Chain and order post effects](./effect-chain) — putting several effects in line.
- [About the rendering pipeline](../concepts/rendering-pipeline) — targets and ownership.
- [Built-in effects](../reference/built-in-effects) — maybe it already exists.
