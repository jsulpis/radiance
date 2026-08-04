import type { RenderTarget, RenderTargetParams } from "../core/renderTarget";
import { GL_HALF_FLOAT, GL_RGBA16F } from "../core/constants";
import { createRenderTarget } from "../core/renderTarget";
import type { glCanvas as _glCanvas } from "../global/glCanvas";
import type { Uniforms } from "../types/types";
import type { compositor as _compositor } from "./compositor";
import type { QuadPassParams } from "./quadRenderPass";
import { quadRenderPass } from "./quadRenderPass";
import type { RenderPass } from "./renderPass";

/**
 * Creates a post-processing effect pass that renders a full-screen quad.
 *
 * Use with {@link _compositor | compositor()} or {@link _glCanvas | glCanvas()}.
 *
 * [Example: Single pass](/examples/post-processing/single-pass/)
 *
 * @param params - Configuration for the effect pass.
 */
export function effectPass<U extends EffectUniforms>({
  gl,
  ...params
}: EffectPassParams<U>): EffectPass<U> {
  let ownedTarget: RenderTarget | null = null;

  const renderPass = quadRenderPass(params);

  if (params.target === undefined) {
    renderPass.onInit((gl) => {
      const { targetParams = floatTargetConfig, resolutionScale = 1 } = params;
      ownedTarget = createRenderTarget(gl, {
        ...targetParams,
        width: (targetParams.width ?? gl.canvas.width) * resolutionScale,
        height: (targetParams.height ?? gl.canvas.height) * resolutionScale,
      });
      renderPass.setTarget(ownedTarget);
    });
  }

  if (gl) {
    renderPass.initialize(gl);
  }

  renderPass.onDispose(() => {
    ownedTarget?.dispose();
  });

  return renderPass;
}

/**
 * Default configuration for high-precision floating point render targets.
 * Useful for HDR and post-processing effects.
 *
 * Use it as a parameter for {@link createRenderTarget | createRenderTarget()}.
 */
export const floatTargetConfig: RenderTargetParams = {
  internalFormat: GL_RGBA16F,
  type: GL_HALF_FLOAT,
};

/**
 * An alias for {@link RenderPass}, specifically used in the context of post-processing effects.
 */
export type EffectPass<U extends Uniforms = Record<string, never>> = RenderPass<U>;

/**
 * Uniforms specifically used in post-processing effects.
 * Supports functional values that receive information about the previous rendering passes.
 *
 * [Example: Multi pass](/examples/post-processing/multi-pass/)
 */
export type EffectUniforms = Uniforms<{
  /**
   * - in an effect with only one pass, the inputPass is the pass rendered before this effect.
   * - in an effect with multiple passes, the inputPass is the pass rendered before the first pass of the effect.
   */
  inputPass: RenderPass;
  /**
   * The pass rendered immediately before this specific effect pass.
   */
  previousPass: RenderPass;
}>;

/**
 * Parameters for creating an {@link effectPass}.
 * @inline
 * @internal
 */
export type EffectPassParams<U extends EffectUniforms> = Omit<QuadPassParams<U>, "target"> &
  (
    | {
        /** Caller-owned render target for this pass (never disposed by the effect), or null to render to the default target. */
        target?: RenderTarget | null;
        targetParams?: never;
      }
    | {
        target?: never;
        /**
         * Parameters for an effect-owned render target, disposed with the effect.
         * @default floatTargetConfig
         */
        targetParams?: RenderTargetParams;
      }
  );
