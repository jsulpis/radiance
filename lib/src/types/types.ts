import type { TextureParams } from "../core/texture";

/**
 * A vector uniform value, representing a vec2, vec3, or vec4.
 */
export type VectorUniform =
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

/**
 * A matrix uniform value, representing a mat3 or mat4.
 */
// prettier-ignore
export type MatrixUniform =
  | [number, number, number,
     number, number, number,
     number, number, number]
  | [number, number, number, number,
     number, number, number, number,
     number, number, number, number,
     number, number, number, number];

/**
 * A texture uniform value, which can be either a {@link TextureParams}
 * or a raw `WebGLTexture`.
 */
export type TextureUniform = TextureParams | WebGLTexture;

/**
 * All valid types for a uniform variable in a shader.
 */
export type UniformValue = number | VectorUniform | MatrixUniform | Float32Array | TextureUniform;

/**
 * A collection of uniform variables.
 */
export type Uniforms = Record<string, UniformValue | Promise<UniformValue>>;

/**
 * A TypedArray (e.g., Float32Array, Uint16Array) used for buffer data.
 */
export type TypedArray = ArrayBufferView & { length: number };

/**
 * Defines a vertex attribute for a shader.
 */
export interface Attribute {
  /** The number of components per vertex attribute (e.g., 2 for vec2). */
  size: number;
  /** The data for the attribute. */
  data: TypedArray | number[];
  /** The GL data type (e.g., gl.FLOAT). Defaults to gl.FLOAT. */
  type?: GLenum;
  /** Whether fixed-point data should be normalized. */
  normalize?: boolean;
  /** The byte distance between consecutive attributes. */
  stride?: number;
  /** The offset of the first component in the buffer. */
  offset?: number;
}

/** A resource that can release its owned browser or GPU resources. */
export interface Disposable {
  /** Releases owned resources. Safe to call more than once. */
  dispose(): void;
}
