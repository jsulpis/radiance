import { effectPass } from "../../passes/effectPass";

import linearFragment from "./glsl/linear.frag";
import acesFragment from "./glsl/aces.frag";
import reinhardFragment from "./glsl/reinhard.frag";
import hableFragment from "./glsl/hable.frag";
import neutralFragment from "./glsl/neutral.frag";
import cineonFragment from "./glsl/cineon.frag";
import agxFragment from "./glsl/agx.frag";

/**
 * Creates a Linear tone mapping effect.
 * Applies a simple exposure multiplier without non-linear compression.
 *
 * @param params - Configuration for the linear tone mapping.
 */
export function linearToneMapping(params?: ToneMappingParams) {
  return createToneMappingPass(linearFragment, params);
}

/**
 * Creates a Hable (Uncharted 2) tone mapping effect.
 * Known for its good contrast and film-like look.
 *
 * @param params - Configuration for the Hable tone mapping.
 */
export function hableToneMapping(params?: ToneMappingParams) {
  return createToneMappingPass(hableFragment, params);
}

/**
 * Creates an ACES Filmic tone mapping effect.
 * Standard filmic tone mapping used in professional cinema and high-end games.
 *
 * @param params - Configuration for the ACES tone mapping.
 */
export function acesToneMapping(params?: ToneMappingParams) {
  return createToneMappingPass(acesFragment, params);
}

/**
 * Creates a Neutral tone mapping effect (Khronos Neutral Tone Mapper).
 * Designed to preserve color hue while compressing dynamic range.
 *
 * @param params - Configuration for the neutral tone mapping.
 */
export function neutralToneMapping(params?: ToneMappingParams) {
  return createToneMappingPass(neutralFragment, params);
}

/**
 * Creates a Cineon tone mapping effect.
 * Mimics the look of film scans.
 *
 * @param params - Configuration for the Cineon tone mapping.
 */
export function cineonToneMapping(params?: ToneMappingParams) {
  return createToneMappingPass(cineonFragment, params);
}

/**
 * Creates an AgX tone mapping effect.
 * Advanced tone mapping designed for superior highlight handling and color fidelity.
 *
 * @param params - Configuration for the AgX tone mapping.
 */
export function agxToneMapping(params?: ToneMappingParams) {
  return createToneMappingPass(agxFragment, params);
}

/**
 * Creates a Reinhard tone mapping effect.
 * This is a simple tone mapping that compresses high intensities into the [0, 1] range.
 *
 * @param params - Configuration for the Reinhard tone mapping.
 */
export function reinhardToneMapping(params?: ReinhardToneMappingParams) {
  const { exposure = 1, outputColorSpace = "sRGB", whitePoint = 1 } = params || {};
  return effectPass({
    fragment: reinhardFragment,
    uniforms: {
      uTexture: ({ inputPass }) => inputPass.target!.texture,
      uExposure: exposure,
      uConvertToSRGB: outputColorSpace === "sRGB",
      uWhitePoint: whitePoint,
    },
  });
}

/**
 * Parameters for the Reinhard tone mapping effect.
 * @inline
 * @internal
 */
type ReinhardToneMappingParams = ToneMappingParams & {
  /**
   * The white point to use for extended Reinhard tone mapping.
   * A value of 1 disables the extended tone mapping.
   *
   * @default 1
   */
  whitePoint?: number;
};

function createToneMappingPass(fragment: string, params?: ToneMappingParams) {
  const { exposure = 1, outputColorSpace = "sRGB" } = params || {};
  return effectPass({
    fragment,
    uniforms: {
      uTexture: ({ inputPass }) => inputPass.target!.texture,
      uExposure: exposure,
      uConvertToSRGB: outputColorSpace === "sRGB",
    },
  });
}

/**
 * Common parameters for tone mapping effects.
 */
export type ToneMappingParams = {
  /**
   * The exposure level to apply to the image before the tone mapping.
   * @default 1
   */
  exposure?: number;
  /**
   * The color space to output the final image in.
   * @default "sRGB"
   */
  outputColorSpace?: "sRGB" | "linear";
};
