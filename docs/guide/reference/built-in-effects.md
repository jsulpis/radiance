# Built-in effects

Parameters of every post-processing effect, and a typical chain order.

All effects are functions that return an `EffectPass` or `CompositeEffectPass`. Use them in `postEffects`, and update their `uniforms` afterwards like any other pass.

```ts
import { bloom, fxaa, glCanvas, hableToneMapping, trails } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  postEffects: [
    trails({ fadeout: 0.25 }),
    bloom({ radius: 0.5, mix: 0.8 }),
    hableToneMapping({ exposure: 1.2 }),
    fxaa(),
  ],
});
```

## `bloom(params?)`

Downsampling / upsampling pyramid that adds glow around bright areas. A `CompositeEffectPass`. Based on the [Unreal Engine bloom](https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/).

| Param    | Type     | Default | Uniform  | Meaning                                    |
| -------- | -------- | ------- | -------- | ------------------------------------------ |
| `levels` | `number` | `8`     | —        | depth of the mip pyramid                   |
| `radius` | `number` | `0.65`  | `uRadius`| blur radius of the upsampling stages       |
| `mix`    | `number` | `0.5`   | `uMix`   | glow intensity blended over the input      |

Example: [Bloom](../../examples/post-processing-builtin/bloom/).

## `trails(params?)`

Double-buffered frame accumulation behind moving objects. A `CompositeEffectPass`.

| Param               | Type                       | Default        | Uniform               | Meaning                                       |
| ------------------- | -------------------------- | -------------- | --------------------- | --------------------------------------------- |
| `fadeout`           | `number`                   | `0.25`         | `uFadeout`            | how fast trails decay (higher = shorter)      |
| `erosion`           | `number`                   | `0`            | `uErosion`            | shrinks the trail (squared internally)        |
| `tailColor`         | `[number × 4]`             | `[1,1,1,1]`    | `uTailColor`          | color the trail fades to                      |
| `tailColorFalloff`  | `number`                   | `0`            | `uTailColorFalloff`   | how quickly the color becomes the tail color  |

Example: [Trails](../../examples/post-processing-builtin/trails/).

## `noise(params?)`

Procedural noise over the image.

| Param       | Type     | Default | Uniform     | Meaning                                              |
| ----------- | -------- | ------- | ----------- | ---------------------------------------------------- |
| `intensity` | `number` | `0.5`   | `uIntensity`| strength of the noise (0–1)                          |
| `size`      | `number` | `2`     | `uSize`     | noise cell size in pixels (1–5)                      |
| `colorMix`  | `number` | `0.5`   | `uColorMix` | 0 = monochrome, 1 = colored noise                    |
| `time`      | `number` | frame `time` | `uTime` | seed; assign `() => 0` to freeze the noise      |

Example: [Noise](../../examples/post-processing-builtin/noise/).

## `fxaa()`

Fast approximate anti-aliasing. Detects luminance edges and blends along them. No parameters — place it **last** so it sees final pixels.

Example: [FXAA](../../examples/post-processing-builtin/fxaa/).

## Tone mapping

Seven operators mapping HDR values to the display. All return an `EffectPass` and share `ToneMappingParams`:

| Param              | Type                         | Default   | Uniform            | Meaning                                  |
| ------------------ | ---------------------------- | --------- | ------------------ | ---------------------------------------- |
| `exposure`         | `number`                     | `1`       | `uExposure`        | multiplier applied before the curve      |
| `outputColorSpace` | `"sRGB" \| "linear"`         | `"sRGB"`  | `uConvertToSRGB`   | final transfer function                  |

| Factory                    | Curve                                  | Extra param                          |
| -------------------------- | -------------------------------------- | ------------------------------------ |
| `linearToneMapping`        | exposure then clamp                    | —                                    |
| `reinhardToneMapping`      | `x / (1 + x)`                          | `whitePoint` (default `1`)           |
| `hableToneMapping`         | Uncharted 2 filmic                     | —                                    |
| `acesToneMapping`          | ACES filmic                            | —                                    |
| `neutralToneMapping`       | Khronos neutral (hue preserving)       | —                                    |
| `cineonToneMapping`        | film-scan look                         | —                                    |
| `agxToneMapping`           | AgX filmic                             | —                                    |

`reinhardToneMapping` also takes `whitePoint: number` (uniform `uWhitePoint`) — luminance mapped to 1; values above `1` enable the extended curve.

Choosing between them: [Tone map the output](../post-processing/tone-map-the-output).

## Typical chain

```
scene → [stylize] → [trails] → [bloom] → [tone mapping] → [fxaa] → canvas
```

Reasoning: accumulate before glowing, glow before compressing, anti-alias the final pixels. See [Chain and order post effects](../post-processing/effect-chain).

## Writing your own

Anything with the [effect contract](../post-processing/custom-effect) slots into the same list — `effectPass` for one step, `compositeEffectPass` for several.

## See also

- [API: Effects](/api/effects/) — signatures and full type definitions.
