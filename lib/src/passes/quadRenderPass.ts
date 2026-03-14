import type { Uniforms } from "../types/types";
import { renderPass, type RenderPassParams } from "./renderPass";
import { findAttributeName, findVaryingName } from "../internal/findName";
import quadVertexShaderSource from "./quadVertexShader.glsl";

/**
 * Creates a render pass that renders a full-screen quad (actually a single large triangle for performance reasons, see [here](https://github.com/pmndrs/postprocessing?tab=readme-ov-file#performance) and [here](https://michaldrobot.com/2014/04/01/gcn-execution-patterns-in-full-screen-passes/)).
 *
 * This is used for creating post-processing effect passes, but can also be used directly for any full-screen rendering.
 *
 * @param gl - The WebGL2 context.
 * @param params - Configuration for the quad render pass.
 */
export function quadRenderPass<U extends Uniforms>(
  gl: WebGL2RenderingContext | undefined,
  { attributes = {}, fragment, vertex, ...renderPassParams }: QuadPassParams<U>,
) {
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

  return renderPass(gl, {
    ...renderPassParams,
    attributes,
    fragment,
    vertex: vertexShader,
  });
}

/**
 * 1 big triangle filling the canvas offers better performance than 2 triangles :
 * @see https://github.com/pmndrs/postprocessing?tab=readme-ov-file#performance
 * @see https://michaldrobot.com/2014/04/01/gcn-execution-patterns-in-full-screen-passes/
 */
const quadVertexPositions = [-1, -1, 3, -1, -1, 3];

/**
 * Parameters for creating a {@link quadRenderPass}.
 * Inherits from {@link RenderPassParams} but makes the vertex shader optional.
 */
export type QuadPassParams<U extends Uniforms = Record<string, never>> = Omit<
  RenderPassParams<U>,
  "vertex"
> & {
  /**
   * Optional vertex shader. If not provided, a default full-screen quad vertex shader is used.
   */
  vertex?: string;
};
