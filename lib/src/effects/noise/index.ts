import { effectPass } from "../../passes/effectPass";
import fragment from "./glsl/noise.frag";

/**
 * Creates a procedural noise post-processing effect.
 *
 * @param params - Noise configuration.
 */
export function noise(params?: NoiseParams) {
  const { intensity = 0.5, size = 2, colorMix = 0.5, time: timeParam } = params || {};

  return effectPass({
    fragment,
    uniforms: {
      uTexture: ({ inputPass }) => inputPass.target!.texture,
      uIntensity: intensity,
      uSize: size,
      uColorMix: colorMix,
      uResolution: ({ passResolution }) => passResolution,
      uTime: ({ time }) => timeParam ?? time,
    },
  });
}

/**
 * Parameters for the {@link noise} effect.
 * @inline
 * @internal
 */
export type NoiseParams = {
  /**
   * Strength of the noise added to the image.
   * Typical values are between 0 and 1, where 0 is no noise and 1 is full noise.
   * @default 0.5
   */
  intensity?: number;
  /**
   * Size of each noise cell in screen pixels.
   * Typical values are between 1 and 5, where smaller values produce finer noise.
   * @default 2
   */
  size?: number;
  /**
   * Mix between monochromatic and colored noise.
   * Typical values are between 0 and 1, where 0 is fully monochromatic and 1 is fully colored.
   * @default 0.5
   */
  colorMix?: number;
  /**
   * Fixed time value for the noise effect. If not provided, the effect will use the time value of the current frame context.
   *
   * You can dynamically update the value:
   * - noiseEffect.uniforms.uTime = () => 0; // Freeze the noise
   * - noiseEffect.uniforms.uTime = ({ time }) => time; // Animate the noise over time
   */
  time?: number;
};
