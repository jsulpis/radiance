import { createHook } from "../internal/createHook";
import type { SyncUniforms } from "../types/types";
import type { RenderTarget } from "../core/renderTarget";
import type { EffectPass } from "./effectPass";
import {
  type RenderPass as _RenderPass,
  type RenderCallback,
  type UpdatedCallback,
} from "./renderPass";

/**
 * Creates a composite effect pass from a series of sub-passes.
 * This is useful for complex effects that require multiple steps, like Bloom or Blur.
 *
 * [Example: Multi pass](/examples/post-processing/multi-pass/)
 *
 * @param params - Configuration for the composite effect pass.
 */
export function compositeEffectPass<U extends SyncUniforms = Record<string, never>>({
  gl,
  passes,
  uniforms = {} as U,
}: CompositeEffectPassParams<U>): CompositeEffectPass<U> {
  const outputPass = passes.at(-1)!;

  const [onBeforeRender, executeBeforeRenderCallbacks] = createHook<RenderCallback<any>>();
  const [onAfterRender, executeAfterRenderCallbacks] = createHook<RenderCallback<any>>();
  const [onUpdated, executeUpdateCallbacks] = createHook<UpdatedCallback<any>>();
  const [onResize, executeResizeCallbacks] = createHook<(width: number, height: number) => void>();
  const [onInit, executeInitCallbacks] = createHook<(gl: WebGL2RenderingContext) => void>();
  const [onDispose, executeDisposeCallbacks] = createHook();
  let _gl: WebGL2RenderingContext | undefined;
  let disposed = false;

  function render() {
    executeBeforeRenderCallbacks({ uniforms });
    for (const pass of passes) pass.render();
    executeAfterRenderCallbacks({ uniforms });
  }

  function initialize(gl: WebGL2RenderingContext) {
    if (disposed || _gl) return;

    for (const pass of passes) {
      pass.initialize(gl);
      pass.onUpdated((...args) => {
        executeUpdateCallbacks(...args);
      });
    }
    _gl = gl;
    executeInitCallbacks(gl);
  }

  if (gl) {
    initialize(gl);
  }

  function setSize(size: { width: number; height: number }) {
    for (const pass of passes) {
      pass.setSize(size);
    }
    executeResizeCallbacks(size.width, size.height);
  }

  function setTarget(target: RenderTarget | null) {
    outputPass.setTarget(target);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const pass of passes) pass.dispose();
    executeDisposeCallbacks();
  }

  return {
    get target() {
      return outputPass.target;
    },
    uniforms,
    passes,
    onBeforeRender,
    onAfterRender,
    onUpdated,
    onResize,
    onInit,
    onDispose,
    initialize,
    render,
    setSize,
    setTarget,
    dispose,
  };
}

/**
 * An effect pass composed of multiple sub-passes.
 *
 * @see {@link EffectPass}
 * @see {@link _RenderPass | RenderPass}
 */
export type CompositeEffectPass<U extends SyncUniforms = Record<string, never>> = Omit<
  EffectPass<U>,
  "fragment" | "vertex"
> & {
  /** The sequence of sub-passes executed by this composite effect. */
  passes: EffectPass<SyncUniforms>[];
};

/**
 * Parameters for creating a {@link compositeEffectPass}.
 * @inline
 * @internal
 */
export type CompositeEffectPassParams<U extends SyncUniforms = Record<string, never>> = {
  /** Optional WebGL2 context used to initialize the composite effect immediately. */
  gl?: WebGL2RenderingContext;
  /** Ordered effect passes to execute. */
  passes: EffectPass<SyncUniforms>[];
  /** Reactive uniform values for the composite effect. */
  uniforms?: U;
};
