import { compositeEffectPass } from "../../passes/compositeEffectPass";
import type { EffectPass } from "../../passes/effectPass";
import { effectPass } from "../../passes/effectPass";
import downSampleFragment from "./glsl/downsample.frag";
import combineFragment from "./glsl/combine.frag";
import sampleVertex from "./glsl/sample.vert";
import upsampleFragment from "./glsl/upsample.frag";

/**
 * Creates a Bloom effect using a downsampling/upsampling pyramid.
 *
 * Based on [Custom Bloom Post-Process in Unreal Engine](https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/).
 *
 * [Example: Bloom (builtin)](/examples/post-processing-builtin/bloom/)
 *
 * @param params - Bloom configuration.
 */
export function bloom(params?: BloomParams) {
  const { levels = 8, radius = 0.65, mix = 0.5 } = params || {};

  const downsamplePasses: EffectPass<any>[] = [];

  // --- Downsample pyramid (progressively half resolution) ---
  for (let level = 1; level <= levels; level++) {
    const pass = effectPass({
      fragment: downSampleFragment,
      vertex: sampleVertex,
      resolutionScale: 1 / 2 ** level,
      uniforms: {
        uTexelSizeMultiplier: 0.5,
        uInputTexture: ({ previousPass }) => previousPass.target!.texture,
      },
    });
    downsamplePasses.push(pass);
  }

  // --- Upsample & accumulate ---
  const upsamplePasses: EffectPass<any>[] = [];

  for (let level = levels - 1; level >= 1; level--) {
    const pass = effectPass({
      fragment: upsampleFragment,
      vertex: sampleVertex,
      resolutionScale: 1 / 2 ** level,
      uniforms: {
        uTexelSizeMultiplier: 1,
        uCurrentTexture: () => downsamplePasses[level].target!.texture,
        uPreviousTexture:
          level === levels - 1
            ? () => downsamplePasses.at(-1)!.target!.texture
            : () => upsamplePasses[levels - 1 - level - 1].target!.texture,
        uRadius: radius,
      },
    });
    upsamplePasses.push(pass);
  }

  // --- Combine original + bloom ---
  const combine = effectPass({
    fragment: combineFragment,
    uniforms: {
      uImage: ({ inputPass }) => inputPass.target!.texture,
      uBloomTexture: ({ previousPass }) => previousPass.target!.texture,
      uMix: mix,
    },
  });

  const bloomPasses = [...downsamplePasses, ...upsamplePasses, combine];

  const bloomUniforms = {
    get uRadius() {
      return upsamplePasses[0].uniforms.uRadius;
    },
    set uRadius(value: number) {
      for (const pass of upsamplePasses) {
        pass.uniforms.uRadius = value;
      }
    },
    get uMix() {
      return combine.uniforms.uMix;
    },
    set uMix(value: number) {
      combine.uniforms.uMix = value;
    },
  };

  return compositeEffectPass({
    passes: bloomPasses,
    uniforms: bloomUniforms,
  });
}

/**
 * Parameters for the {@link bloom} effect.
 * @inline
 * @internal
 */
export type BloomParams = {
  /**
   * Number of mip levels for the bloom pyramid.
   * @default 8
   */
  levels?: number;
  /**
   * Blur radius for the upsampling stages.
   * @default 0.65
   */
  radius?: number;
  /**
   * Bloom intensity / mix factor.
   * @default 0.5
   */
  mix?: number;
};
