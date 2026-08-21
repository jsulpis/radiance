import { effectPass } from "../../passes/effectPass";
import fragment from "./glsl/fxaa.frag";

/**
 * Creates a fast approximate anti-aliasing post-processing effect.
 *
 * FXAA detects local luminance edges and blends samples along their direction.
 * The effect uses the current pass resolution to determine its texel size.
 */
export function fxaa() {
  return effectPass({
    fragment,
    uniforms: {
      uTexture: ({ inputPass }) => inputPass.target!.texture,
      uTexelSize: ({ passResolution }) => [1 / passResolution[0], 1 / passResolution[1]],
    },
  });
}
