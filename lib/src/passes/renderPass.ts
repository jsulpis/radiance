import type { UniformContext, UniformSources, UniformValues } from "../types/types";
import type { RawRenderOptions } from "./rawRenderPass";
import {
  rawRenderPass,
  type RawRenderPassParams,
  type RawRenderPass,
  type UpdatedCallback,
} from "./rawRenderPass";
import { uniformRuntime } from "../internal/uniformRuntime";
import { createUniformContext } from "../internal/createUniformContext";

/**
 * Creates a rendering pass that resolves functions, promises, and media uniforms
 * before delegating the actual draw to {@link rawRenderPass}.
 */
export function renderPass<Context extends UniformContext, U extends UniformSources<Context>>(
  params: RenderPassParams<Context, U>,
): RenderPass<U, Context> {
  const raw = rawRenderPass<UniformValues>({ ...params, uniforms: {} });
  const runtime = uniformRuntime<Context, U>(params.uniforms || ({} as U));
  let _gl: WebGL2RenderingContext | undefined = params.gl;

  raw.onInit((gl) => {
    _gl = gl;
  });

  function render(options?: RenderOptions<Context>) {
    const context = options?.context ?? (_gl && createUniformContext(_gl));
    runtime.resolve(context as Readonly<Context> | undefined);
    raw.setUniformValues(runtime.getValues());
    raw.render(options);
  }

  raw.onDispose(() => runtime.dispose());

  return {
    ...raw,
    render,
    onUpdated: runtime.onUpdated,
    uniforms: runtime.uniformsProxy,
    get target() {
      return raw.target;
    },
  };
}

/** Parameters for creating a managed {@link renderPass}. */
export type RenderPassParams<
  Context extends UniformContext = UniformContext,
  U extends UniformSources<Context> = UniformSources<Context>,
> = Omit<RawRenderPassParams<UniformValues>, "uniforms"> & {
  /** Uniform values, synchronous functions, promises, or media descriptors. */
  uniforms?: U;
};

/** A rendering pass with managed uniform sources. */
export type RenderPass<
  U extends UniformSources<any> = UniformSources<any>,
  Context extends UniformContext = UniformContext,
> = Omit<RawRenderPass<UniformValues>, "uniforms" | "render" | "setUniformValues" | "onUpdated"> & {
  /** The original reactive uniform-source object. */
  uniforms: U;
  /** Renders after resolving uniform sources with the supplied context. */
  render: (options?: RenderOptions<Context>) => void;
  /** Registers a callback whenever a uniform source changes. */
  onUpdated: (callback: UpdatedCallback<U>) => void;
};

/** Options shared by raw and managed render functions. */
export type RenderOptions<Context extends UniformContext = UniformContext> = RawRenderOptions & {
  /** Context passed to function-valued uniforms by managed passes. */
  context?: Readonly<Context>;
};
