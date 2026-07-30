import {
  GL_FRAGMENT_SHADER,
  GL_LINK_STATUS,
  GL_SEPARATE_ATTRIBS,
  GL_VERTEX_SHADER,
} from "./constants";
import { createShader } from "./shader";

/**
 * Creates and links a WebGL program with vertex and fragment shaders.
 *
 * This function also handles transform feedback configuration if requested.
 *
 * @param gl - The WebGL2 context.
 * @param fragment - Fragment shader source string or pre-compiled WebGLShader.
 * @param vertex - Vertex shader source string or pre-compiled WebGLShader.
 * @param transformFeedbackVaryings - Optional array of varying names for Transform Feedback.
 * @returns The linked WebGLProgram, or null if creation or linking failed.
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  fragment: string | WebGLShader,
  vertex: string | WebGLShader,
  transformFeedbackVaryings?: string[],
) {
  const vertexShader =
    vertex instanceof WebGLShader ? vertex : createShader(gl, vertex, GL_VERTEX_SHADER);
  const fragmentShader =
    fragment instanceof WebGLShader ? fragment : createShader(gl, fragment, GL_FRAGMENT_SHADER);

  function dispose() {
    if (typeof vertex === "string" && vertexShader) gl.deleteShader(vertexShader);
    if (typeof fragment === "string" && fragmentShader) gl.deleteShader(fragmentShader);
  }

  const program = gl.createProgram();
  if (program === null || vertexShader == null || fragmentShader == null) {
    console.error("could not create program");
    dispose();
    gl.deleteProgram(program);
    return null;
  }

  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(program, transformFeedbackVaryings, GL_SEPARATE_ATTRIBS);
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, GL_LINK_STATUS)) {
    console.error("could not link program: " + gl.getProgramInfoLog(program));
    dispose();
    gl.deleteProgram(program);
    return null;
  }

  dispose();

  return program;
}
