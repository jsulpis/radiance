# Tone map the output

If your shader produces values above 1 — bright lights, additive particles, a bloom pyramid — add a tone mapping effect at the end of the chain to compress them into displayable colors.

```ts
import { acesToneMapping, bloom, glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uTime: ({ time }) => time / 500 },
  postEffects: [
    bloom(),
    acesToneMapping({ exposure: 1.5 }), // last: HDR → display
  ],
});
```

Without it, values above 1 clamp to white and highlights turn into flat discs.

## Pick an operator

All operators take `{ exposure, outputColorSpace }` and differ in how they roll off the highlights.

| Operator                   | Look                                                          | When to reach for it                       |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| `linearToneMapping`        | Multiplies by exposure, then clamps                           | Debugging; scenes already in \[0, 1\]      |
| `reinhardToneMapping`      | Gentle `x / (1 + x)` compression                             | Neutral default, soft highlights           |
| `hableToneMapping`         | Filmic Uncharted 2 curve, strong contrast                     | Punchy, cinematic looks                    |
| `acesToneMapping`          | Cinema standard, warm highlights                              | Matching a film / game pipeline            |
| `neutralToneMapping`       | Khronos neutral, preserves hue                                | Accurate color with extended range         |
| `cineonToneMapping`        | Film-scan look                                                | Soft, slightly washed film emulation       |
| `agxToneMapping`           | Modern filmic, highlight detail and color fidelity            | The current all-rounder                    |

They are swappable one line at a time. Try them side by side on your scene before committing — [Bloom](../../examples/post-processing-builtin/bloom/) has a live exposure control to play with.

### Extra knob on Reinhard

`reinhardToneMapping` takes `whitePoint`: the luminance mapped to 1. Values above `1` enable the extended curve, which keeps small highlights from washing out.

```ts
reinhardToneMapping({ exposure: 1, whitePoint: 4 });
```

## Exposure

`exposure` multiplies the image before the curve. It is a plain uniform (`uExposure`), so it animates and binds to UI like anything else:

```ts
const toneMapping = hableToneMapping({ exposure: 1 });
glCanvas({ canvas: "#glCanvas", fragment, postEffects: [toneMapping] });

toneMapping.uniforms.uExposure = 2.5; // a flash, a fade, a slider…
```

## Output color space

By default the operators end with a linear → sRGB transfer (`outputColorSpace: "sRGB"`), which is what a normal canvas expects. If the drawing buffer is already in linear space (or you chain another transfer yourself), keep the values linear:

```ts
acesToneMapping({ exposure: 1, outputColorSpace: "linear" });
```

For wide-gamut output, set the drawing buffer when creating the canvas:

```ts
glCanvas({
  canvas: "#glCanvas",
  fragment,
  colorSpace: "display-p3", // or "srgb"
  postEffects: [acesToneMapping()],
});
```

See [About color management](../concepts/color-management) for how the pieces fit — texture color spaces in, tone mapping and `colorSpace` out.

## Where it goes in the chain

Last — or at least after every effect that feeds on brightness. [Chain and order post effects](./effect-chain) has the full ordering rules.

```ts
postEffects: [
  trails(), // accumulates bright motion
  bloom(), // glows on it
  acesToneMapping({ exposure: 1.2 }), // then compress
  fxaa(), // anti-alias the final pixels
],
```

## See also

- [About color management](../concepts/color-management) — the linear workflow around this step.
- [Built-in effects](../reference/built-in-effects) — parameters of every operator.
- [Bloom](../../examples/post-processing-builtin/bloom/) — bloom + tone mapping with live controls.
