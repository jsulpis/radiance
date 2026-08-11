import type { RenderTarget, RenderTargetParams } from "../core/renderTarget";
import { GL_HALF_FLOAT, GL_RGBA16F } from "../core/constants";
import { createRenderTarget } from "../core/renderTarget";
import type { glCanvas as _glCanvas } from "../global/glCanvas";
import type { UniformContext, UniformSources } from "../types/types";
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
 * An effect pass with contextual and asynchronous uniform sources.
 */
export type EffectPass<U extends EffectUniforms = EffectUniforms> = RenderPass<
  U,
  EffectUniformContext
>;

/**
 * Context supplied to effect uniform functions.
 */
export type EffectUniformContext = UniformContext & {
  /**
   * - in an effect with only one pass, the inputPass is the pass rendered before this effect.
   * - in an effect with multiple passes, the inputPass is the pass rendered before the first pass of the effect.
   */
  inputPass: RenderPass;
  /**
   * The pass rendered immediately before this specific effect pass.
   */
  previousPass: RenderPass;
};

/** Uniform sources accepted by post-processing effects. */
export type EffectUniforms = UniformSources<EffectUniformContext>;

/**
 * Parameters for creating an {@link effectPass}.
 * @inline
 * @internal
 */
export type EffectPassParams<U extends EffectUniforms> = Omit<
  QuadPassParams<EffectUniformContext, U>,
  "target"
> &
  (
    | {
        /** Caller-owned target, or `null` to render to the default framebuffer. */
        target?: RenderTarget | null;
        targetParams?: never;
      }
    | {
        target?: never;
        /**
         * Parameters for an effect-owned target, disposed with the effect.
         * @default floatTargetConfig
         */
        targetParams?: RenderTargetParams;
      }
  );
