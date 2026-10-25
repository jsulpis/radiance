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

| Param    | Type     | Default | Uniform   | Meaning                               |
| -------- | -------- | ------- | --------- | ------------------------------------- |
| `levels` | `number` | `8`     | —         | depth of the mip pyramid              |
| `radius` | `number` | `0.65`  | `uRadius` | blur radius of the upsampling stages  |
| `mix`    | `number` | `0.5`   | `uMix`    | glow intensity blended over the input |

Example: [Bloom](../../examples/post-processing-builtin/bloom/).

## `trails(params?)`

Double-buffered frame accumulation behind moving objects. A `CompositeEffectPass`.

| Param              | Type           | Default     | Uniform             | Meaning                                      |
| ------------------ | -------------- | ----------- | ------------------- | -------------------------------------------- |
| `fadeout`          | `number`       | `0.25`      | `uFadeout`          | how fast trails decay (higher = shorter)     |
| `erosion`          | `number`       | `0`         | `uErosion`          | shrinks the trail (squared internally)       |
| `tailColor`        | `[number × 4]` | `[1,1,1,1]` | `uTailColor`        | color the trail fades to                     |
| `tailColorFalloff` | `number`       | `0`         | `uTailColorFalloff` | how quickly the color becomes the tail color |

Example: [Trails](../../examples/post-processing-builtin/trails/).

## `noise(params?)`

Procedural noise over the image.

| Param       | Type     | Default      | Uniform      | Meaning                                    |
| ----------- | -------- | ------------ | ------------ | ------------------------------------------ |
| `intensity` | `number` | `0.5`        | `uIntensity` | strength of the noise (0–1)                |
| `size`      | `number` | `2`          | `uSize`      | noise cell size in pixels (1–5)            |
| `colorMix`  | `number` | `0.5`        | `uColorMix`  | 0 = monochrome, 1 = colored noise          |
| `time`      | `number` | frame `time` | `uTime`      | seed; assign `() => 0` to freeze the noise |

Example: [Noise](../../examples/post-processing-builtin/noise/).

## `pixelate(params?)`

Snaps the image to a grid of square blocks. Each block samples the input once, at its center. One full-screen pass with a single
texture fetch and no extra render target.

| Param  | Type     | Default | Uniform | Meaning                                          |
| ------ | -------- | ------- | ------- | ------------------------------------------------ |
| `size` | `number` | `8`     | `uSize` | block size in **CSS pixels** (1 = no pixelation) |

`size` is independent of the device pixel ratio, so a given value looks the same on any display. Assign `pixelateEffect.uniforms.uSize` to change it at runtime.

::: tip Smoother and cheaper
For a smoother pixelated look, render the scene into a small texture and upscale it with `magFilter: "nearest"`. Downsampling averages the source, so the blocks keep more detail, and far fewer fragments are shaded. On a canvas rendered at a low `dpr`, `image-rendering: pixelated` on the canvas gives the same blocky look with no shader pass at all.
:::

Example: [Pixelate](../../examples/post-processing-builtin/pixelate/).

## Dither

Dithering effects quantize the image to a small palette and use patterns to make the missing shades read from a distance. All use a single full-screen pass and need no extra render target. Tone map first with `outputColorSpace: "linear"`, then apply them as the last effect.

| Function                    | Look                                     | Extra param                             |
| --------------------------- | ---------------------------------------- | --------------------------------------- |
| `ditherBayer(params?)`      | classic cross-hatch ordered matrix       | `matrix` (`2`, `4` or `8`, default `8`) |
| `ditherBlueNoise(params?)`  | smooth, no visible pattern (recommended) | —                                       |
| `ditherIgn(params?)`        | soft film-like grain                     | —                                       |
| `ditherWhiteNoise(params?)` | uncorrelated static                      | —                                       |
| `ditherHalftone(params?)`   | angled round dots, print screen          | `angle` (degrees, default `15`)         |

Shared params:

| Param    | Type      | Default | Uniform   | Meaning                                                                                        |
| -------- | --------- | ------- | --------- | ---------------------------------------------------------------------------------------------- |
| `size`   | `number`  | `1`     | `uSize`   | cell size in **CSS pixels**, rounded to whole device pixels (`ditherHalftone` defaults to `4`) |
| `color`  | `boolean` | `true`  | `uColor`  | `true` = each channel dithered on its own, `false` = grayscale                                 |
| `levels` | `number`  | `3`     | `uLevels` | values per channel in the palette, at least `2`                                                |

`levels` sets the palette: in grayscale it is the number of grays (`2` is pure black and white), in color it is the number of values per channel (`levels`³ colors: `3` gives 27 and `2` gives the 8 corners of the RGB cube). Values are evenly spaced in sRGB, so `4` gives 0, 85, 170 and 255. The default is `3` (0, 128, 255).

The effects expect **linear** input and write **sRGB** output. Between the two nearest palette values the pattern is mixed in linear light, so the average light matches the source and the image keeps its brightness. If you need tone mapping, use `outputColorSpace: "linear"`, and dither after it: the tone map compresses HDR without clipping. Dithering before the tone map clips anything above 1; feeding sRGB values (the tone mapping default) applies the sRGB curve twice and brightens the image.

`ditherBlueNoise` samples a 64×64 void-and-cluster mask one texel per dither cell.

For `ditherHalftone`, `size` is the distance between dot centres, not their diameter. Dots occupy only part of each cell, so halftone looks finer than the solid-cell patterns at the same value; increase `size` for a coarser screen.

Example: [Dither](../../examples/post-processing-builtin/dither/).

## `fxaa()`

Fast approximate anti-aliasing. Detects luminance edges and blends along them. No parameters — place it **last** so it sees final pixels.

Example: [FXAA](../../examples/post-processing-builtin/fxaa/).

## Tone mapping

Seven operators mapping HDR values to the display. All return an `EffectPass` and share `ToneMappingParams`:

| Param              | Type                 | Default  | Uniform          | Meaning                             |
| ------------------ | -------------------- | -------- | ---------------- | ----------------------------------- |
| `exposure`         | `number`             | `1`      | `uExposure`      | multiplier applied before the curve |
| `outputColorSpace` | `"sRGB" \| "linear"` | `"sRGB"` | `uConvertToSRGB` | final transfer function             |

| Factory               | Curve                            | Extra param                |
| --------------------- | -------------------------------- | -------------------------- |
| `linearToneMapping`   | exposure then clamp              | —                          |
| `reinhardToneMapping` | `x / (1 + x)`                    | `whitePoint` (default `1`) |
| `hableToneMapping`    | Uncharted 2 filmic               | —                          |
| `acesToneMapping`     | ACES filmic                      | —                          |
| `neutralToneMapping`  | Khronos neutral (hue preserving) | —                          |
| `cineonToneMapping`   | film-scan look                   | —                          |
| `agxToneMapping`      | AgX filmic                       | —                          |

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
