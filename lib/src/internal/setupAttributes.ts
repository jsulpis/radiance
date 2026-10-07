import { setAttribute } from "../core/attribute";
import { GL_UNSIGNED_INT, GL_UNSIGNED_SHORT } from "../core/constants";
import type { Attribute } from "../types/types";

export function setupAttributes(attributes: Record<string, Attribute>) {
  let _gl: WebGL2RenderingContext;
  let _vao: WebGLVertexArrayObject | null;
  const buffers: WebGLBuffer[] = [];

  let vertexCount = 0;
  let instanceCount = -1;

  function initialize(gl: WebGL2RenderingContext, program: WebGLProgram) {
    _gl = gl;
    _vao = _gl.createVertexArray();
    _gl.bindVertexArray(_vao);

    for (const [attributeName, attributeObj] of Object.entries(attributes)) {
      const divisor = attributeObj.divisor ?? 0;
      const attr = setAttribute(_gl, program, attributeName, attributeObj);

      if (divisor > 0) {
        instanceCount = Math.max(instanceCount, attr.vertexCount * divisor);
      } else {
        vertexCount = Math.max(vertexCount, attr.vertexCount);
      }

      if (attr.buffer) buffers.push(attr.buffer);
    }
  }

  const hasIndices = attributes.index != undefined;
  const indexType =
    attributes.index?.data.length < Math.pow(2, 16) ? GL_UNSIGNED_SHORT : GL_UNSIGNED_INT;

  function getVertexCount() {
    return vertexCount;
  }

  function getInstanceCount() {
    return instanceCount === -1 ? null : instanceCount;
  }

  function bindVAO() {
    _gl.bindVertexArray(_vao);
  }

  function dispose() {
    for (const buffer of buffers) _gl.deleteBuffer(buffer);
    buffers.length = 0;
    if (_vao) _gl.deleteVertexArray(_vao);
    _vao = null;
  }

  return {
    initialize,
    getVertexCount,
    getInstanceCount,
    bindVAO,
    dispose,
    hasIndices,
    indexType,
  };
}
