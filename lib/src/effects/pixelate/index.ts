import { effectPass } from "../../passes/effectPass";
import fragment from "./glsl/pixelate.frag";

/**
 * Creates a pixelate post-processing effect that snaps the image to a grid of
 * square blocks.
 *
 * The effect samples the input once per block at its center, so it costs a
 * single full-screen pass with one texture fetch and needs no extra render
 * target.
 *
 * @remarks
 * For a smoother pixelated look that is also cheaper, render the scene into a
 * small texture and upscale it with `magFilter: "nearest"`. Downsampling
 * averages the source, so the blocks keep more detail, and far fewer fragments
 * are shaded. On a canvas rendered at a low `dpr`, `image-rendering: pixelated`
 * gives the same blocky look with no shader pass at all.
 *
 * @param params - Pixelate configuration.
 */
export function pixelate(params?: PixelateParams) {
  const { size = 8 } = params || {};

  return effectPass({
    fragment,
    uniforms: {
      uTexture: ({ inputPass }) => inputPass.target!.texture,
      uResolution: ({ passResolution }) => passResolution,
      uSize: size,
      uDpr: ({ dpr }) => dpr,
    },
  });
}

/**
 * Parameters for the {@link pixelate} effect.
 * @inline
 * @internal
 */
export type PixelateParams = {
  /**
   * Size of each pixel block in CSS pixels. The value is independent of the
   * device pixel ratio, so the result looks the same on any display.
   *
   * You can dynamically update the value:
   * - pixelateEffect.uniforms.uSize = 16; // coarser pixelation
   * - pixelateEffect.uniforms.uSize = 1; // back to the original image
   *
   * @default 8
   */
  size?: number;
};
