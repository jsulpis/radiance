import { createHook } from "../internal/createHook";
import type { UniformSources } from "../types/types";
import type { RenderTarget } from "../core/renderTarget";
import type { EffectPass, EffectUniformContext } from "./effectPass";
import type { RenderOptions, UpdatedCallback } from "./rawRenderPass";
import type { RenderCallback } from "./rawRenderPass";
import type { RenderPass } from "./renderPass";

/**
 * Creates a composite effect pass from a series of sub-passes.
 * This is useful for complex effects that require multiple steps, like Bloom or Blur.
 *
 * [Example: Multi pass](/examples/post-processing/multi-pass/)
 *
 * @param params - Configuration for the composite effect pass.
 */
export function compositeEffectPass<
  U extends UniformSources<EffectUniformContext> = Record<string, never>,
>({ gl, passes, uniforms = {} as U }: CompositeEffectPassParams<U>): CompositeEffectPass<U> {
  const outputPass = passes.at(-1)!;

  const [onBeforeRender, executeBeforeRenderCallbacks] = createHook<RenderCallback<any>>();
  const [onAfterRender, executeAfterRenderCallbacks] = createHook<RenderCallback<any>>();
  const [onUpdated, executeUpdateCallbacks] = createHook<UpdatedCallback<any>>();
  const [onResize, executeResizeCallbacks] = createHook<(width: number, height: number) => void>();
  const [onInit, executeInitCallbacks] = createHook<(gl: WebGL2RenderingContext) => void>();
  const [onDispose, executeDisposeCallbacks] = createHook();
  let _gl: WebGL2RenderingContext | undefined;
  let disposed = false;

  function render(options?: RenderOptions<EffectUniformContext>) {
    executeBeforeRenderCallbacks({ uniforms });
    const context = options?.context;
    let previousPass: RenderPass | EffectPass | undefined =
      context?.previousPass ?? context?.inputPass;

    for (const pass of passes) {
      if (context) {
        pass.render({
          ...options,
          context: {
            ...context,
            inputPass: context.inputPass,
            previousPass: previousPass ?? context.inputPass,
            passResolution: pass.target
              ? [pass.target.width, pass.target.height]
              : context.canvasResolution,
          } as EffectUniformContext,
        });
      } else {
        pass.render(options);
      }
      previousPass = pass;
    }
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
 * @see {@link RenderPass}
 */
export type CompositeEffectPass<
  U extends UniformSources<EffectUniformContext> = UniformSources<EffectUniformContext>,
> = Omit<EffectPass<U>, "fragment" | "vertex" | "getResolution"> & {
  /** The sequence of sub-passes executed by the composite effect. */
  passes: EffectPass[];
};

/**
 * Parameters for creating a {@link compositeEffectPass}.
 * @inline
 * @internal
 */
export type CompositeEffectPassParams<
  U extends UniformSources<EffectUniformContext> = UniformSources<EffectUniformContext>,
> = {
  /** Optional WebGL2 context used to initialize the composite effect immediately. */
  gl?: WebGL2RenderingContext;
  /** Ordered effect passes to execute. */
  passes: EffectPass[];
  /** Reactive uniform sources for the composite effect itself. */
  uniforms?: U;
};
