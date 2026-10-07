import type { TextureParams } from "../core/texture";
import type { LoopData } from "../helpers/loop";

/**
 * A vector uniform value, representing a vec2, vec3, or vec4.
 */
export type VectorUniform =
  [number, number] | [number, number, number] | [number, number, number, number];

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
 * All concrete values that can be uploaded to a uniform variable.
 */
export type UniformValue =
  number | boolean | VectorUniform | MatrixUniform | Float32Array | TextureUniform;

/** Context supplied to every contextual uniform function. */
export interface UniformContext extends LoopData {
  /** Physical canvas dimensions in pixels, including device-pixel-ratio scaling. */
  canvasResolution: [number, number];
  /** Dimensions of the target currently rendered by the pass. */
  passResolution: [number, number];
}

/**
 * A uniform source resolved before a render.
 *
 * A source may be a concrete value, a promise, or a synchronous function
 * receiving the current frame context. Functions must not return promises.
 * Managed passes resolve these sources; low-level `rawRenderPass()` accepts
 * concrete values.
 */
export type UniformSource<Context = UniformContext> =
  UniformValue | PromiseLike<UniformValue> | ((context: Readonly<Context>) => UniformValue);

/**
 * A collection of uniform sources keyed by GLSL uniform name.
 */
export type UniformSources<Context = UniformContext> = Record<string, UniformSource<Context>>;

/** A collection of concrete uniform values ready for GPU upload. */
export type UniformValues = Record<string, UniformValue | undefined>;

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
  /**
   * The GL data type (e.g., gl.FLOAT).
   * @default inferred from the data type
   */
  type?: GLenum;
  /**
   * Whether fixed-point data should be normalized.
   * @default false
   */
  normalize?: boolean;
  /**
   * The byte distance between consecutive attributes.
   * @default 0
   */
  stride?: number;
  /**
   * The offset of the first component in the buffer.
   * @default 0
   */
  offset?: number;
  /**
   * The rate at which this attribute advances: `0` advances per vertex,
   * values `≥ 1` advance every N instances.
   *
   * The instance count of a pass is inferred from these attributes as
   * `data length × divisor`.
   * @default 0
   */
  divisor?: number;
}

/** A resource that can release its owned browser or GPU resources. */
export interface Disposable {
  /** Releases owned resources. Safe to call more than once. */
  dispose(): void;
}
