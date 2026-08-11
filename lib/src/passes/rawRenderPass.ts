import type { Attribute, Disposable, UniformContext, UniformValues } from "../types/types";
import { GL_BLEND, GL_DEPTH_TEST, GL_ONE, GL_ONE_MINUS_SRC_ALPHA } from "../core/constants";
import { createProgram } from "../core/program";
import { setRenderTarget } from "../core/renderTarget";
import type { RenderTarget } from "../core/renderTarget";
import { setupUniforms } from "../internal/setupUniforms";
import { setupAttributes } from "../internal/setupAttributes";
import { createHook } from "../internal/createHook";

/**
 * Creates a low-level rendering pass for concrete uniform values.
 *
 * This is the core primitive for rendering anything to the screen or a texture.
 * It handles program creation, concrete uniform management, attribute setup,
 * render-target selection, state configuration, and resizing.
 *
 * This pass deliberately does not evaluate uniform functions or promises. Use
 * `renderPass()` for managed uniform sources.
 *
 * @param params - Configuration for the render pass.
 */
export function rawRenderPass<U extends UniformValues>({
  gl,
  target = null,
  fragment,
  vertex,
  attributes = {},
  uniforms: userUniforms = {} as U,
  blending = "none",
  depthTest = false,
  drawMode: userDrawMode,
  transformFeedbackVaryings,
  resolutionScale = 1,
}: RawRenderPassParams<U>): RawRenderPass<U> {
  /*
   * INIT
   */

  let _target = target;
  let _program: WebGLProgram;
  let _gl: WebGL2RenderingContext;
  let disposed = false;

  const {
    initialize: initializeUniforms,
    onUpdated,
    uploadUniforms,
    getUniformsSnapshot,
    setUniformValues,
    uniformsProxy,
    dispose: disposeUniforms,
  } = setupUniforms(userUniforms);
  const {
    initialize: initializeAttributes,
    getVertexCount,
    bindVAO,
    hasIndices,
    indexType,
    dispose: disposeAttributes,
  } = setupAttributes(attributes);

  const [onInit, executeInitCallbacks] = createHook<(gl: WebGL2RenderingContext) => void>();
  const [onDispose, executeDisposeCallbacks] = createHook();

  function initialize(gl: WebGL2RenderingContext) {
    if (disposed || _gl) return;

    const program = createProgram(gl, fragment, vertex, transformFeedbackVaryings);
    if (program == null) {
      throw new Error("could not initialize the render pass");
    }
    _gl = gl;
    _program = program;
    _gl.useProgram(_program);

    initializeUniforms(_gl, _program);
    initializeAttributes(_gl, _program);

    executeInitCallbacks(_gl);
  }

  if (gl) {
    initialize(gl);
  }

  /*
   * UPDATE
   */

  const [onResize, executeResizeCallbacks] = createHook<(width: number, height: number) => void>();
  let _resolution: [number, number] = [0, 0];

  function setSize(size: { width: number; height: number }) {
    if (disposed) return;
    const width = size.width * resolutionScale;
    const height = size.height * resolutionScale;

    _resolution = [width, height];
    if (_target != null) {
      _target.setSize(width, height);
    }
    executeResizeCallbacks(width, height);
  }

  function setTarget(target: RenderTarget | null) {
    if (disposed) return;
    _target = target;
  }

  function getResolution(): [number, number] {
    return _target ? [_target.width, _target.height] : [..._resolution];
  }

  /*
   * RENDER
   */

  const drawMode = userDrawMode || (vertex.includes("gl_PointSize") ? "POINTS" : "TRIANGLES");

  const [onBeforeRender, executeBeforeRenderCallbacks] = createHook<RenderCallback<U>>();
  const [onAfterRender, executeAfterRenderCallbacks] = createHook<RenderCallback<U>>();

  function render({ target, clear }: RenderOptions = {}) {
    if (disposed) return;
    if (_gl == undefined) {
      throw new Error("The render pass must be initialized before calling the render function");
    }

    setRenderTarget(_gl, target ?? _target, clear);
    _gl.useProgram(_program);

    bindVAO();
    uploadUniforms();
    setBlending(_gl, blending);
    setDepthTest(_gl, depthTest);

    executeBeforeRenderCallbacks({ uniforms: getUniformsSnapshot() as U });

    if (hasIndices) {
      _gl.drawElements(_gl[drawMode], getVertexCount(), indexType, 0);
    } else {
      _gl.drawArrays(_gl[drawMode], 0, getVertexCount());
    }

    executeAfterRenderCallbacks({ uniforms: getUniformsSnapshot() as U });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (_program != undefined) {
      disposeUniforms();
      disposeAttributes();
      _gl.deleteProgram(_program);
    }
    executeDisposeCallbacks();
  }

  return {
    render,
    initialize,
    setTarget,
    get target() {
      return _target;
    },
    setSize,
    setUniformValues,
    uniforms: uniformsProxy,
    vertex,
    fragment,
    onUpdated,
    onBeforeRender,
    onAfterRender,
    getResolution,
    onInit,
    onResize,
    onDispose,
    dispose,
  };
}

function setBlending(gl: WebGL2RenderingContext, blending: "none" | "normal" | "additive") {
  if (blending === "none") {
    return gl.disable(GL_BLEND);
  }

  gl.enable(GL_BLEND);

  // assuming premultiplied alpha
  switch (blending) {
    case "normal": {
      return gl.blendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);
    }
    case "additive": {
      return gl.blendFunc(GL_ONE, GL_ONE);
    }
  }
}

function setDepthTest(gl: WebGL2RenderingContext, depthTest: boolean) {
  if (depthTest) {
    gl.enable(GL_DEPTH_TEST);
  } else {
    gl.disable(GL_DEPTH_TEST);
  }
}

/** Parameters for creating a {@link rawRenderPass}. */
export type RawRenderPassParams<U extends UniformValues = Record<string, never>> = {
  /**
   * Optional WebGL2 context used to initialize the pass immediately.
   *
   * Passes without a context are initialized by calling `pass.initialize(gl)` or using the compositor.
   * Calling `initialize()` multiple times with the same context is a no-op.
   */
  gl?: WebGL2RenderingContext;
  /**
   * Optional initial render target for the pass.
   * If not provided, it will render directly to the canvas or can be set later.
   */
  target?: RenderTarget | null;
  /**
   * Fragment shader source code.
   */
  fragment: string;
  /**
   * Vertex shader source code.
   */
  vertex: string;
  /**
   * Mapping of attribute names to their data and configuration.
   */
  attributes?: Record<string, Attribute>;
  /**
   * Initial concrete uniform values. Functions and promises are resolved by higher-level APIs
   * such as `renderPass()` before rendering.
   */
  uniforms?: U;
  /**
   * Blending mode to use for this pass.
   * @default "none"
   */
  blending?: "none" | "normal" | "additive";
  /**
   * Whether to enable depth testing.
   * @default false
   */
  depthTest?: boolean;
  /**
   * WebGL draw mode.
   * @default "POINTS" if `gl_PointSize` is found in the vertex shader, otherwise "TRIANGLES".
   */
  drawMode?: DrawMode;
  /**
   * Array of varying names for Transform Feedback.
   */
  transformFeedbackVaryings?: string[];
  /**
   * Scaling factor applied to the resolution when the pass is resized.
   * @default 1
   */
  resolutionScale?: number;
};

/**
 * A low-level rendering pass that encapsulates shaders, concrete uniforms, and attributes.
 */
export type RawRenderPass<U extends UniformValues = Record<string, never>> = Disposable & {
  /**
   * Executes the render pass.
   * @param opts - Rendering params.
   */
  render: (opts?: RenderOptions) => void;
  /** The current render target for this pass. */
  target: RenderTarget | null;
  /** Updates the current render target. */
  setTarget: (target: RenderTarget | null) => void;
  /** Resizes the render target associated with this pass. */
  setSize: ({ width, height }: { width: number; height: number }) => void;
  /** Returns the current dimensions used by the pass. */
  getResolution: () => [number, number];
  /** The reactive uniforms proxy for this pass. */
  uniforms: U;
  /** @internal Stages or uploads concrete values. */
  setUniformValues: (values: UniformValues) => void;
  /** The vertex shader source. */
  vertex: string;
  /** The fragment shader source. */
  fragment: string;
  /** Registers a callback called whenever concrete uniforms are updated. */
  onUpdated: (callback: UpdatedCallback<U>) => void;
  /** Registers a callback called just before rendering. */
  onBeforeRender: (callback: RenderCallback<U>) => void;
  /** Registers a callback called just after rendering. */
  onAfterRender: (callback: RenderCallback<U>) => void;
  /** Registers a callback called when the pass is initialized with a GL context. */
  onInit: (callback: (gl: WebGL2RenderingContext) => void) => void;
  /** Registers a callback called when the pass is resized. */
  onResize: (callback: (width: number, height: number) => void) => void;
  /** Registers a callback called when the pass is disposed. */
  onDispose: (callback: () => void) => void;
  /** Initializes the pass with a WebGL2 context. */
  initialize: (gl: WebGL2RenderingContext) => void;
};

/**
 * Callback function executed during the raw render cycle.
 * @param args - An object containing the uniforms used for the render.
 */
export type RenderCallback<U extends UniformValues = Record<string, never>> = (
  args: Readonly<{ uniforms: U }>,
) => void;

/** Callback invoked when a concrete uniform changes. */
export type UpdatedCallback<U extends Record<string, unknown> = Record<string, never>> = (
  name: string,
  value: unknown,
  oldValue: unknown,
  uniforms: Readonly<U>,
) => void;

/**
 * Valid WebGL draw modes.
 * @inline
 */
type DrawMode =
  "POINTS" | "LINES" | "LINE_STRIP" | "LINE_LOOP" | "TRIANGLES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN";

/** Options shared by raw and managed render functions. */
export type RenderOptions<Context extends UniformContext = UniformContext> = {
  /** Context passed to function-valued uniforms by managed passes. */
  context?: Readonly<Context>;
  /** Temporary render target for this invocation. */
  target?: RenderTarget | null;
  /** Whether to clear the target after binding it. */
  clear?: boolean;
};
