import { GL_COMPILE_STATUS } from "./constants";

/**
 * Creates, compiles, and returns a WebGL shader.
 *
 * It automatically handles conversion of the source code to GLSL 3.00 ES
 * (e.g., adding `#version 300 es`, handling `texture2D` vs `texture`, etc.).
 *
 * @param gl - The WebGL2 context.
 * @param source - Shader source string.
 * @param type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
 * @returns The compiled WebGLShader, or null if creation or compilation failed.
 */
export function createShader(gl: WebGL2RenderingContext, source: string, type: GLenum) {
  const shader = gl.createShader(type);
  if (shader == null) {
    console.error("could not create shader");
    gl.deleteShader(shader);
    return null;
  }
  gl.shaderSource(shader, convertToGLSL300(source));
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, GL_COMPILE_STATUS)) {
    console.error("could not compile shader: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  return shader;
}

/**
 * Automatically converts GLSL 1.00 ES shader code into GLSL 3.00 ES.
 *
 * This includes:
 * - Adding the `#version 300 es` directive.
 * - Replacing `attribute` with `in`.
 * - Replacing `varying` with `in` (fragment) or `out` (vertex).
 * - Replacing `texture2D` with `texture`.
 * - Replacing `gl_FragColor` with a custom `out vec4 fragColor`.
 * - Ensuring a default precision of `highp float`.
 */
function convertToGLSL300(shader: string): string {
  let glsl300Shader = shader.replace(/\battribute\b/g, "in").replace(/\btexture2D\b/g, "texture");

  if (shader.includes("gl_FragColor")) {
    // Fragment shader
    glsl300Shader = glsl300Shader.replace(
      /(\n*\s*)void\s+main/,
      "$1out vec4 fragColor;$1void main",
    );
    glsl300Shader = glsl300Shader
      .replace(/\bvarying\b/g, "in")
      .replace(/\bgl_FragColor\b/g, "fragColor");
  } else {
    // Vertex shader
    glsl300Shader = glsl300Shader.replace(/\bvarying\b/g, "out");
  }

  const precisionRegex = /precision\s+(highp|mediump|lowp)\s+float\s*;/;
  if (!precisionRegex.test(glsl300Shader)) {
    glsl300Shader = glsl300Shader.replace(/^(#version 300 es)?/, "$1\nprecision highp float;");
  }

  if (!shader.startsWith("#version")) {
    glsl300Shader = "#version 300 es\n" + glsl300Shader;
  }

  return glsl300Shader;
}
