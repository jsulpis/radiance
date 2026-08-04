import type { DataTextureParams, ImageTextureParams } from "../core/texture";
import { GL_ACTIVE_UNIFORMS, GL_TEXTURE_2D, GL_TEXTURE0 } from "../core/constants";
import { fillTexture } from "../core/texture";
import type { UpdatedCallback } from "../passes/renderPass";
import type { NumericArray, Uniforms } from "../types/types";
import { createHook } from "./createHook";

export function setupUniforms<U extends Uniforms>(uniforms: U) {
  type UniformName = Extract<keyof U, string>;

  let textureUnitIndex = 0;
  const textureUnits = new Map<UniformName, { index: number; texture?: WebGLTexture | null }>();

  let _gl: WebGL2RenderingContext;
  let _program: WebGLProgram;

  const [onUpdated, executeUpdateCallbacks] = createHook<UpdatedCallback<U>>();

  const uniformsLocations = new Map<UniformName, WebGLUniformLocation>();

  function initialize(gl: WebGL2RenderingContext, program: WebGLProgram) {
    _gl = gl;
    _program = program;

    const uniformsCount = _gl.getProgramParameter(_program, GL_ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformsCount; i++) {
      const uniformName = _gl.getActiveUniform(_program, i)?.name as UniformName;
      uniformsLocations.set(uniformName, _gl.getUniformLocation(_program, uniformName) ?? -1);
    }
  }

  const uniformsProxy = new Proxy(
    { ...uniforms },
    {
      set(target, name: UniformName, value) {
        if (value !== target[name]) {
          const oldValue = target[name];
          target[name] = value;
          executeUpdateCallbacks(name, value, oldValue, getSnapshot(target));
        }
        return true;
      },
    },
  );

  function setUniforms() {
    for (const [uniformName, uniformValue] of Object.entries(uniformsProxy)) {
      setUniform(
        uniformName as UniformName,
        (typeof uniformValue === "function" ? uniformValue() : uniformValue) as U[UniformName],
      );
    }
  }

  function setUniform<Uname extends UniformName>(name: Uname, value: U[Uname]) {
    const uniformLocation = uniformsLocations.get(name) || -1;
    if (uniformLocation === -1) return -1;

    if (typeof value === "number") return _gl.uniform1f(uniformLocation, value);
    if (typeof value === "boolean") return _gl.uniform1i(uniformLocation, value ? 1 : 0);

    if (value instanceof WebGLTexture) {
      if (!textureUnits.has(name)) {
        textureUnits.set(name, { index: textureUnitIndex++ });
      }
      const { index } = textureUnits.get(name)!;
      _gl.activeTexture(GL_TEXTURE0 + index);
      _gl.bindTexture(GL_TEXTURE_2D, value);

      return _gl.uniform1i(uniformLocation, index);
    }

    if (isNumericArray(value)) {
      const floatArray = new Float32Array(value);
      switch (value.length) {
        case 2: {
          return _gl.uniform2fv(uniformLocation, floatArray);
        }
        case 3: {
          return _gl.uniform3fv(uniformLocation, floatArray);
        }
        case 4: {
          return _gl.uniform4fv(uniformLocation, floatArray);
        }
        case 9: {
          return _gl.uniformMatrix3fv(uniformLocation, false, floatArray);
        }
        case 16: {
          return _gl.uniformMatrix4fv(uniformLocation, false, floatArray);
        }
      }
    }

    if (isTextureParams(value)) {
      if (!textureUnits.has(name)) {
        const texture = _gl.createTexture();
        textureUnits.set(name, { index: textureUnitIndex++, texture });
      }
      const { index, texture } = textureUnits.get(name)!;
      _gl.activeTexture(GL_TEXTURE0 + index);
      fillTexture(_gl, texture!, value);

      return _gl.uniform1i(uniformLocation, index);
    }
  }

  function getUniformsSnapshot() {
    return getSnapshot({ ...uniformsProxy });
  }

  function dispose() {
    for (const { texture } of textureUnits.values()) {
      if (texture) _gl.deleteTexture(texture);
    }
    textureUnits.clear();
  }

  return {
    initialize,
    uniformsProxy,
    onUpdated,
    setUniforms,
    getUniformsSnapshot,
    dispose,
  };
}

function getSnapshot<Obj extends Record<string, unknown>>(object: Obj): Obj {
  return Object.freeze({ ...object });
}

function isNumericArray(value: unknown): value is NumericArray {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as { length?: unknown }).length === "number"
  );
}

function isTextureParams(value: unknown): value is ImageTextureParams | DataTextureParams {
  if (value == null || typeof value !== "object") return false;
  return (
    (value as ImageTextureParams).src !== undefined ||
    (value as DataTextureParams).data !== undefined
  );
}
