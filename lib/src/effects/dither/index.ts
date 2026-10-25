import type { EffectUniforms } from "../../passes/effectPass";
import { effectPass } from "../../passes/effectPass";
import bayerFragment from "./glsl/bayer.frag";
import blueNoiseFragment from "./glsl/blueNoise.frag";
import whiteNoiseFragment from "./glsl/whiteNoise.frag";
import ignFragment from "./glsl/ign.frag";
import halftoneFragment from "./glsl/halftone.frag";
import { blueNoiseMask } from "./blueNoiseMask";

/**
 * Creates a Bayer ordered dithering post-processing effect.
 *
 * Each pixel is thresholded against a repeating Bayer matrix, which produces
 * the classic cross-hatch pattern.
 *
 * @remarks
 * Expects linear input and writes sRGB-encoded output, so use it as the last
 * effect, after a tone mapping with `outputColorSpace: "linear"`. The pattern
 * is mixed in linear light between the two nearest palette levels, so the
 * average light matches the source.
 *
 * @param params - Dither configuration.
 */
export function ditherBayer(params?: DitherBayerParams) {
  const { matrix = 8 } = params || {};
  return ditherPass(bayerFragment, params, { uMatrix: matrix });
}

/**
 * Creates a blue-noise dithering post-processing effect.
 *
 * The threshold comes from a 64x64 void-and-cluster blue-noise mask sampled one
 * texel per dither cell. Blue noise has no visible cross-hatch, so it breaks
 * banding more smoothly than any ordered matrix.
 *
 * @remarks
 * Expects linear input and writes sRGB-encoded output, so use it as the last
 * effect, after a tone mapping with `outputColorSpace: "linear"`. The pattern
 * is mixed in linear light between the two nearest palette levels, so the
 * average light matches the source.
 *
 * @param params - Dither configuration.
 */
export function ditherBlueNoise(params?: DitherBlueNoiseParams) {
  return ditherPass(blueNoiseFragment, params, { uBlueNoise: blueNoiseMask() });
}

/**
 * Creates an interleaved gradient noise dithering post-processing effect.
 *
 * The threshold is computed analytically and gives a soft, film-like dither.
 *
 * @remarks
 * Expects linear input and writes sRGB-encoded output, so use it as the last
 * effect, after a tone mapping with `outputColorSpace: "linear"`. The pattern
 * is mixed in linear light between the two nearest palette levels, so the
 * average light matches the source.
 *
 * @param params - Dither configuration.
 */
export function ditherIgn(params?: DitherParams) {
  return ditherPass(ignFragment, params);
}

/**
 * Creates a white-noise dithering post-processing effect.
 *
 * The threshold is a per-cell hash, giving the uncorrelated "static" look of a
 * classic random dither.
 *
 * @remarks
 * Expects linear input and writes sRGB-encoded output, so use it as the last
 * effect, after a tone mapping with `outputColorSpace: "linear"`. The pattern
 * is mixed in linear light between the two nearest palette levels, so the
 * average light matches the source.
 *
 * @param params - Dither configuration.
 */
export function ditherWhiteNoise(params?: DitherParams) {
  return ditherPass(whiteNoiseFragment, params);
}

/**
 * Creates a halftone post-processing effect.
 *
 * Unlike the ordered matrices, this is a continuous, angled dot screen: round
 * dots grow from each cell centre, which reads as a printed halftone and scales
 * to any size without visible steps. The `size` parameter sets the distance between
 * dot centres, not their diameter, so halftone looks finer than the solid-cell
 * patterns at the same value.
 *
 * @remarks
 * Expects linear input and writes sRGB-encoded output, so use it as the last
 * effect, after a tone mapping with `outputColorSpace: "linear"`. The pattern
 * is mixed in linear light between the two nearest palette levels, so the
 * average light matches the source.
 *
 * @param params - Dither configuration.
 */
export function ditherHalftone(params?: DitherHalftoneParams) {
  const { size = 4, angle = 15 } = params || {};
  return ditherPass(halftoneFragment, { ...params, size }, { uAngle: angle });
}

function ditherPass<U extends EffectUniforms = EffectUniforms>(
  fragment: string,
  params: DitherParams | undefined,
  uniforms: U = {} as U,
) {
  const { size = 1, color = true, levels = 3 } = params || {};

  return effectPass({
    fragment,
    uniforms: {
      uTexture: ({ inputPass }) => inputPass.target!.texture,
      uResolution: ({ passResolution }) => passResolution,
      uDpr: ({ dpr }) => dpr,
      uSize: size,
      uColor: color,
      uLevels: levels,
      ...uniforms,
    },
  });
}

/**
 * Common parameters for the dithering effects.
 * @inline
 * @internal
 */
export type DitherParams = {
  /**
   * Size of each dither cell in CSS pixels, rounded to whole device pixels.
   * The value is independent of the device pixel ratio, so the result looks
   * the same on any display.
   *
   * You can dynamically update the value:
   * - ditherEffect.uniforms.uSize = 3; // chunkier pattern
   *
   * @default 1 (except for halftone, which uses 4)
   */
  size?: number;
  /**
   * When `true` each channel is dithered on its own, so the palette has
   * `levels`³ colors. When `false` the output is grayscale.
   *
   * You can dynamically update the value:
   * - ditherEffect.uniforms.uColor = false;
   *
   * @default true
   */
  color?: boolean;
  /**
   * Number of values per channel in the palette (at least 2), evenly spaced in
   * sRGB. In grayscale this is the number of grays; in color it is the number
   * of values per channel, so `3` gives 27 colors. `2` gives pure black and
   * white (or the 8 corners of the RGB cube in color).
   *
   * You can dynamically update the value:
   * - ditherEffect.uniforms.uLevels = 4;
   *
   * @default 3
   */
  levels?: number;
};

/**
 * Parameters for the {@link ditherBayer} effect.
 * @inline
 * @internal
 */
export type DitherBayerParams = DitherParams & {
  /**
   * Side of the Bayer matrix. Larger matrices give finer, less regular
   * patterns.
   *
   * You can dynamically update the value:
   * - ditherEffect.uniforms.uMatrix = 2; // 2, 4 or 8
   *
   * @default 8
   */
  matrix?: 2 | 4 | 8;
};

/**
 * Parameters for the {@link ditherBlueNoise} effect.
 * @inline
 * @internal
 */
export type DitherBlueNoiseParams = DitherParams;

/**
 * Parameters for the {@link ditherHalftone} effect.
 * @inline
 * @internal
 */
export type DitherHalftoneParams = DitherParams & {
  /**
   * Rotation of the dot screen in degrees. Non-zero angles avoid the moiré
   * that axis-aligned screens produce.
   *
   * You can dynamically update the value:
   * - ditherEffect.uniforms.uAngle = 45;
   *
   * @default 15
   */
  angle?: number;
};
