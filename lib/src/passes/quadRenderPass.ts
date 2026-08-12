import type { UniformContext, UniformSources } from "../types/types";
import { renderPass, type RenderPassParams } from "./renderPass";
import { findAttributeName, findVaryingName } from "../internal/findName";
import quadVertexShaderSource from "./quadVertexShader.glsl";

/**
 * Creates a render pass that renders a full-screen quad (actually a single
 * large triangle for performance reasons; see
 * [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing?tab=readme-ov-file#performance)
 * and [GCN execution patterns](https://michaldrobot.com/2014/04/01/gcn-execution-patterns-in-full-screen-passes/)).
 *
 * This is used for direct full-screen rendering. It is also the geometry
 * primitive used by post-processing effects.
 *
 * Uniform sources can be concrete values, functions, promises, or media
 * descriptors. Use `effectPass()` or `glCanvas()` for post-processing
 * pipelines and canvas lifecycle management.
 *
 * @param params - Configuration for the quad render pass.
 */
export function quadRenderPass<
  Context extends UniformContext = UniformContext,
  U extends UniformSources<Context> = UniformSources<Context>,
>({ attributes = {}, fragment, vertex, ...renderPassParams }: QuadPassParams<Context, U>) {
  const uvVaryingName = findVaryingName(fragment, "uv");

  const vertexShader =
    vertex || quadVertexShaderSource.replace(/(\bvUv\b)/g, uvVaryingName || "$1");

  const hasPositionAttribute = Object.keys(attributes).some((attributeName) =>
    attributeName.toLocaleLowerCase().endsWith("position"),
  );

  if (!hasPositionAttribute) {
    const positionAttributeName = findAttributeName(vertexShader, "position");
    if (positionAttributeName) {
      attributes[positionAttributeName] = {
        size: 2,
        data: quadVertexPositions,
      };
    }
  }

  return renderPass({
    ...renderPassParams,
    attributes,
    fragment,
    vertex: vertexShader,
  });
}

/** 1 large triangle filling the canvas. */
const quadVertexPositions = [-1, -1, 3, -1, -1, 3];

/**
 * Parameters for creating a {@link quadRenderPass}.
 *
 * Inherits from {@link RenderPassParams} but makes the vertex shader optional.
 * @inline
 * @internal
 */
export interface QuadPassParams<
  Context extends UniformContext = UniformContext,
  U extends UniformSources<Context> = UniformSources<Context>,
> extends Omit<RenderPassParams<Context, U>, "vertex"> {
  /**
   * Optional vertex shader. If omitted, the built-in full-screen triangle vertex
   * shader is used and its UV varying is adapted to the fragment shader.
   */
  vertex?: string;
}
