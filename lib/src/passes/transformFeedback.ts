import { bindBuffer } from "../core/buffer";
import {
  GL_ARRAY_BUFFER,
  GL_POINTS,
  GL_RASTERIZER_DISCARD,
  GL_TRANSFORM_FEEDBACK,
  GL_TRANSFORM_FEEDBACK_BUFFER,
} from "../core/constants";
import type { Attribute, SyncUniforms } from "../types/types";
import type { RenderPass } from "./renderPass";
import { renderPass } from "./renderPass";

/**
 * Creates a Transform Feedback pass for GPGPU tasks without rendering to a texture.
 *
 * It allows you to run a vertex shader and capture its output varyings into buffers
 * that can then be read back by the CPU or used as input for another pass.
 *
 * @param params - Configuration for the transform feedback pass.
 */
export function transformFeedback<O extends string, U extends SyncUniforms>({
  gl,
  vertex,
  attributes = {},
  uniforms = {} as U,
  outputs,
}: TransformFeedbackParams<O, U>) {
  const firstAttribute = Object.values(attributes)[0];
  const vertexCount = firstAttribute ? firstAttribute.data!.length / firstAttribute.size : 0;

  const outputBuffers = Object.fromEntries(
    Object.entries<{ size: number }>(outputs).map(([name, { size }]) => [
      name,
      bindBuffer(gl, GL_ARRAY_BUFFER, new Float32Array(vertexCount * size)),
    ]),
  ) as Record<O, WebGLBuffer>;

  const mainPass = renderPass({
    gl,
    fragment: `void main() { gl_FragColor = vec4(0.0); }`,
    vertex,
    attributes,
    uniforms,
    transformFeedbackVaryings: Object.keys(outputs),
    drawMode: "POINTS",
  });

  const tf = gl.createTransformFeedback();
  gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, tf);

  for (const [index, buffer] of Object.values(outputBuffers).entries()) {
    gl.bindBufferBase(GL_TRANSFORM_FEEDBACK_BUFFER, index, buffer as WebGLBuffer);
  }

  mainPass.onBeforeRender(() => {
    gl.enable(GL_RASTERIZER_DISCARD);
    gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, tf);
    gl.beginTransformFeedback(GL_POINTS);
  });

  mainPass.onAfterRender(() => {
    gl.endTransformFeedback();
    gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
    gl.disable(GL_RASTERIZER_DISCARD);
  });

  const tfRenderPass: TransformFeedbackPass<O, U> = Object.assign(mainPass, {
    getOutputData: function (bufferName: O) {
      const output = new Float32Array(vertexCount * outputs[bufferName].size);
      const buffer = outputBuffers[bufferName];
      gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
      gl.getBufferSubData(GL_ARRAY_BUFFER, 0, output);
      return output;
    },
    outputBuffers,
  });
  tfRenderPass.onDispose(() => {
    gl.deleteTransformFeedback(tf);
    for (const buffer of Object.values<WebGLBuffer>(outputBuffers)) gl.deleteBuffer(buffer);
  });

  return tfRenderPass;
}

/**
 * Parameters for the {@link transformFeedback} pass.
 * @inline
 * @internal
 */
export interface TransformFeedbackParams<
  O extends string,
  U extends SyncUniforms = Record<string, never>,
> {
  /** WebGL2 context. */
  gl: WebGL2RenderingContext;
  /** Vertex shader source. Should write to the output varyings. */
  vertex: string;
  /** Vertex attributes (input buffers). */
  attributes?: Record<string, Attribute>;
  /** Uniform values for the pass. */
  uniforms?: U;
  /**
   * Definition of the transform feedback output buffers.
   * Maps varying names to their expected component size (e.g., 3 for vec3).
   */
  outputs: Record<O, { size: number }>;
}

/**
 * Specialized render pass for Transform Feedback.
 */
export type TransformFeedbackPass<
  O extends string,
  U extends SyncUniforms = Record<string, never>,
> = Omit<
  RenderPass<U>,
  "initialize" | "target" | "setTarget" | "setSize" | "vertex" | "fragment"
> & {
  /** Retrieves data from a specific output buffer. */
  getOutputData: (bufferName: O) => Float32Array;
  /** Raw WebGLBuffer handles for each output varying. */
  outputBuffers: Record<O, WebGLBuffer>;
};
