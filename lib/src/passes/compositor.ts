import type { RenderTarget } from "../core/renderTarget";
import { createRenderTarget } from "../core/renderTarget";
import { findUniformName } from "../internal/findName";
import { createHook } from "../internal/createHook";
import type { CompositeEffectPass } from "./compositeEffectPass";
import type { EffectPass } from "./effectPass";
import type { RenderPass } from "./renderPass";
import { floatTargetConfig } from "./effectPass";
import type { Disposable } from "../types/types";

/**
 * The compositor handles the combination of the main render pass and the subsequent effects.
 *
 * It manages:
 * - Initialization of the WebGL context for all effects.
 * - Automatic creation of intermediate floating-point render targets.
 * - Injecting `previousPass` and `inputPass` references into effect uniforms.
 * - Automatic linking of the previous pass's output texture to the next effect's input.
 * - Rendering all passes in the correct order.
 *
 * @param gl - The WebGL2 context.
 * @param renderPass - The main scene render pass.
 * @param effects - An array of post-processing effects to apply.
 */
export function compositor(
  gl: WebGL2RenderingContext,
  renderPass: RenderPass<any>,
  effects: Array<EffectPass<any> | CompositeEffectPass<any>>,
): Compositor {
  // add the ability to render to floating-point buffers
  gl.getExtension("EXT_color_buffer_float");

  const [onBeforeRender, executeBeforeRenderCallbacks] = createHook();
  const [onAfterRender, executeAfterRenderCallbacks] = createHook();
  let disposed = false;

  let intermediateTarget: RenderTarget | null = null;
  if (effects.length > 0 && renderPass.target === null) {
    intermediateTarget = createRenderTarget(gl, { ...floatTargetConfig, depthBuffer: true });
    renderPass.setTarget(intermediateTarget);
  }

  let previousPass = renderPass;

  for (const [index, effect] of effects.entries()) {
    effect.initialize(gl);

    if (index === effects.length - 1 && effect.target !== null) {
      effect.setTarget(null);
    }

    if (isCompositeEffectPass(effect)) {
      const inputPass = previousPass;
      for (const effectPass of effect.passes) {
        const previousPassRef = previousPass;
        setupEffectPass(effectPass, previousPassRef, inputPass);
        previousPass = effectPass;
      }
    } else {
      setupEffectPass(effect, previousPass);
      previousPass = effect;
    }
  }

  const allPasses = [renderPass, ...effects];

  function render({ clear }: { clear?: boolean } = {}) {
    executeBeforeRenderCallbacks();
    for (const [index, pass] of allPasses.entries()) {
      pass.render(index === 0 ? { clear } : {});
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
  effect: EffectPass | CompositeEffectPass<any>,
): effect is CompositeEffectPass<any> {
  return Array.isArray((effect as CompositeEffectPass).passes);
}

function setupEffectPass(
  effect: EffectPass<any>,
  previousPass: EffectPass<any> | RenderPass<any>,
  inputPass?: EffectPass<any> | RenderPass<any>,
) {
  // provide the previousPass and inputPass to the uniforms functions
  for (const uniformName of Object.keys(effect.uniforms)) {
    const uniformValue = effect.uniforms[uniformName];
    if (typeof uniformValue === "function") {
      effect.uniforms[uniformName] = () => uniformValue({ previousPass, inputPass });
    }
  }

  // detect the first texture uniform and, if it has no texture provided, fill it with the previous pass
  const textureUniformName =
    findUniformName(effect.fragment, "image") ||
    findUniformName(effect.fragment, "texture") ||
    findUniformName(effect.fragment, "pass");

  if (textureUniformName && effect.uniforms[textureUniformName] === undefined) {
    effect.uniforms[textureUniformName] = () => previousPass.target?.texture;
  }
}

export type Compositor = Disposable & {
  /** Renders the entire chain: the main pass followed by all effects. */
  render: (opts?: { clear?: boolean }) => void;
  /** Resizes all passes and their respective render targets. */
  setSize: (size: { width: number; height: number }) => void;
  /** Flat array of all passes managed by this compositor (main pass + all effects). */
  allPasses: Array<RenderPass<any> | CompositeEffectPass<any>>;
  /** Registers a callback called before the whole rendering pipeline starts. */
  onBeforeRender: (callback: () => void) => void;
  /** Registers a callback called after the whole rendering pipeline finishes. */
  onAfterRender: (callback: () => void) => void;
};
