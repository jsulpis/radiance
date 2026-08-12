import type { RenderTarget } from "../core/renderTarget";
import { createRenderTarget } from "../core/renderTarget";
import { createHook } from "../internal/createHook";
import type { CompositeEffectPass } from "./compositeEffectPass";
import type { EffectPass, EffectUniformContext } from "./effectPass";
import type { RenderOptions, RenderPass } from "./renderPass";
import { floatTargetConfig } from "./effectPass";
import type { Disposable } from "../types/types";
import { createUniformContext } from "../internal/createUniformContext";

/**
 * Composes a main pass and post-processing effects into one render graph.
 *
 * The compositor initializes every pass, creates intermediate targets, resolves
 * contextual uniform functions, and renders the chain in order. It owns the
 * lifecycle of supplied effects and intermediate targets.
 *
 * It manages:
 * - Initialization of the WebGL context for every pass.
 * - Automatic creation of intermediate floating-point render targets.
 * - Supplying `previousPass`, `inputPass`, and frame context to effect uniforms.
 * - Rendering every effect in the correct order.
 *
 * @param params - Rendering context, main pass, and optional effects.
 */
export function compositor({ gl, renderPass, postEffects = [] }: CompositorParams): Compositor {
  // add the ability to render to floating-point buffers
  gl.getExtension("EXT_color_buffer_float");

  const [onBeforeRender, executeBeforeRenderCallbacks] = createHook();
  const [onAfterRender, executeAfterRenderCallbacks] = createHook();
  let disposed = false;

  const allPasses = [renderPass, ...postEffects];

  for (const pass of allPasses) {
    pass.initialize(gl);
  }

  let intermediateTarget: RenderTarget | null = null;
  if (postEffects.length > 0 && renderPass.target === null) {
    intermediateTarget = createRenderTarget(gl, { ...floatTargetConfig, depthBuffer: true });
    renderPass.setTarget(intermediateTarget);
  }

  function render(options?: RenderOptions) {
    executeBeforeRenderCallbacks();

    const { target: outputTarget, ...passOptions } = options ?? {};
    renderPass.render(postEffects.length > 0 ? passOptions : options);

    let previousPass: RenderPass<any, any> | EffectPass | CompositeEffectPass = renderPass;
    for (const [index, effect] of postEffects.entries()) {
      const isFinal = index === postEffects.length - 1;
      const target = isFinal ? (outputTarget ?? null) : effect.target;
      const frameContext = options?.context ?? createUniformContext(gl);

      effect.render({
        target,
        context: {
          ...frameContext,
          passResolution: target ? [target.width, target.height] : frameContext.canvasResolution,
          inputPass: previousPass,
          previousPass,
        } as EffectUniformContext,
        clear: false,
      });
      previousPass = isCompositeEffectPass(effect) ? effect.passes.at(-1)! : effect;
    }

    executeAfterRenderCallbacks();
  }

  function setSize(size: { width: number; height: number }) {
    for (const pass of allPasses) {
      pass.setSize(size);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    intermediateTarget?.dispose();
    for (const pass of allPasses) pass.dispose();
  }

  return {
    render,
    setSize,
    allPasses,
    onBeforeRender,
    onAfterRender,
    dispose,
  };
}

function isCompositeEffectPass(
  effect: EffectPass | CompositeEffectPass,
): effect is CompositeEffectPass {
  return Array.isArray((effect as CompositeEffectPass).passes);
}

export type Compositor = Disposable & {
  /** Renders the main pass and every post-processing effect in order. */
  render: (opts?: RenderOptions) => void;
  /** Resizes every pass and render target managed by the compositor. */
  setSize: (size: { width: number; height: number }) => void;
  /** Top-level passes supplied to the compositor. */
  allPasses: Array<RenderPass<any, any> | EffectPass | CompositeEffectPass>;
  /** Registers a callback called before the complete chain renders. */
  onBeforeRender: (callback: () => void) => void;
  /** Registers a callback called after the complete chain renders. */
  onAfterRender: (callback: () => void) => void;
};

/**
 * Parameters for creating a {@link compositor}.
 *
 * @inline
 * @internal
 */
export interface CompositorParams {
  /** WebGL2 context shared by all passes. */
  gl: WebGL2RenderingContext;
  /** Main scene pass rendered before post-processing. */
  renderPass: RenderPass<any, any>;
  /** Post-processing effects rendered after the main scene pass. */
  postEffects?: Array<EffectPass | CompositeEffectPass>;
}
