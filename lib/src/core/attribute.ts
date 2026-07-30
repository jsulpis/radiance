import type { Attribute } from "../types/types";
import {
  GL_ARRAY_BUFFER,
  GL_BYTE,
  GL_ELEMENT_ARRAY_BUFFER,
  GL_FLOAT,
  GL_INT,
  GL_SHORT,
  GL_UNSIGNED_BYTE,
  GL_UNSIGNED_INT,
  GL_UNSIGNED_SHORT,
} from "./constants";
import { bindBuffer, getBufferData } from "./buffer";

/**
 * Sets up a vertex attribute for a given shader program.
 *
 * This function handles buffer creation, binding, and attribute pointer configuration.
 * It also supports special handling for the "index" attribute (ELEMENT_ARRAY_BUFFER).
 *
 * @param gl - The WebGL2 context.
 * @param program - The WebGL program containing the attribute.
 * @param name - The name of the attribute in the shader.
 * @param attribute - The attribute data and configuration.
 */
export function setAttribute(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  attribute: Attribute,
): SetAttributeResult {
  const bufferData = getBufferData(attribute.data, name === "index");
  const location = gl.getAttribLocation(program, name);

  if (name === "index") {
    const buffer = bindBuffer(gl, GL_ELEMENT_ARRAY_BUFFER, bufferData);

    if (location === -1) {
      return { location, vertexCount: bufferData.length, buffer };
    }
  }

  if (location === -1) {
    console.warn(`No location found for attribute "${name}".`);
    return { location, vertexCount: 0 };
  }

  const buffer = bindBuffer(gl, GL_ARRAY_BUFFER, bufferData);

  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(
    location,
    attribute.size,
    attribute.type || getGLType(gl, bufferData),
    attribute.normalize || false,
    attribute.stride || 0,
    attribute.offset || 0,
  );
  gl.bindBuffer(GL_ARRAY_BUFFER, null);

  const vertexCount = attribute.stride
    ? bufferData.byteLength / attribute.stride
    : bufferData.length / attribute.size;

  if (!Number.isInteger(vertexCount)) {
    console.warn(
      `The computed vertex count of the "${name}" attribute is not an integer: ${vertexCount}. There might be an issue with the provided ${attribute.stride === undefined ? "size" : "stride"}.`,
    );
  }

  return { location, vertexCount, buffer };
}

function getGLType(_gl: WebGL2RenderingContext, data: ArrayBufferView) {
  if (data instanceof Float32Array) return GL_FLOAT;
  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) return GL_UNSIGNED_BYTE;
  if (data instanceof Int8Array) return GL_BYTE;
  if (data instanceof Uint16Array) return GL_UNSIGNED_SHORT;
  if (data instanceof Int16Array) return GL_SHORT;
  if (data instanceof Uint32Array) return GL_UNSIGNED_INT;
  if (data instanceof Int32Array) return GL_INT;
  return GL_FLOAT;
}

/**
 * @inline
 */
interface SetAttributeResult {
  /** The location of the attribute in the shader program. */
  location: number;
  /** The computed vertex count based on the attribute data and configuration. */
  vertexCount: number;
  /** The WebGL buffer associated with the attribute, if any. */
  buffer?: WebGLBuffer | null;
}
