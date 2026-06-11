import type { TypedArray } from "../types/types";
import { GL_STATIC_DRAW } from "./constants";

/**
 * Creates, binds, and fills a WebGL buffer with data.
 *
 * @internal
 * @param gl - The WebGL2 context.
 * @param target - The buffer target (e.g., gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER).
 * @param data - The data to fill the buffer with.
 * @returns The created WebGLBuffer.
 */
export function bindBuffer(
  gl: WebGL2RenderingContext,
  target: GLenum,
  data: TypedArray | number[],
) {
  const buffer = gl.createBuffer();
  const bufferData = getBufferData(data);
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, bufferData, GL_STATIC_DRAW);

  return buffer;
}

/**
 * Converts raw numerical data or TypedArrays into a suitable TypedArray for WebGL buffers.
 *
 * @internal
 * @param data - The raw data.
 * @param isIndex - Whether the data is for an index buffer.
 * @returns A TypedArray representation of the data.
 */
export function getBufferData(data: TypedArray | number[], isIndex?: boolean) {
  if (ArrayBuffer.isView(data)) {
    return data;
  }
  if (isIndex) {
    return data.length < 65_536 ? new Uint16Array(data) : new Uint32Array(data);
  }
  return new Float32Array(data);
}
