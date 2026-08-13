import { onResize } from "../helpers/onResize";
import type { LoopObj } from "../helpers/loop";
import { loop, type LoopParams } from "../helpers/loop";
import type { UniformSources, UniformContext, Disposable } from "../types/types";
import type { UpdatedCallback } from "../passes/rawRenderPass";
import type { GLContextParams, WebGL2ContextAttributes } from "./glContext";
import { glContext } from "./glContext";
import type { QuadPassParams } from "../passes/quadRenderPass";
import { quadRenderPass } from "../passes/quadRenderPass";
import type { CompositorParams } from "../passes/compositor";
import { compositor } from "../passes/compositor";
import { createHook } from "../internal/createHook";
import { isOffscreen } from "../internal/typeGuards";
import type { RenderOptions } from "../passes/renderPass";

/**
 * The main high-level function for managing a WebGL canvas.
 *
 * It combines WebGL2 context creation, a full-screen render pass, a
 * post-processing compositor, resize handling, render scheduling, and an
 * optional animation clock. Uniform functions receive a {@link UniformContext};
 * promise sources are resolved for both the main pass and effects.
 */
export const glCanvas = <U extends UniformSources<UniformContext>>(
  params: GLCanvasParams<U>,
): GLCanvas<U> => {
  const {
    canvas: canvasProp,
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2),
    postEffects,
    immediate,
    renderMode: renderModeParam,
    colorSpace,
    webglAttributes,
  } = params;
  const renderMode = renderModeParam ?? inferRenderMode(params.uniforms);

  const {
    gl,
    canvas,
    setSize: setCanvasSize,
  } = glContext({ canvas: canvasProp, ...webglAttributes, colorSpace });

  const renderPass = quadRenderPass<UniformContext, U>({ ...params, gl });
  const mainCompositor = compositor({ gl, renderPass, postEffects });
  let disposed = false;
  let renderFrame: number | undefined;
  // flag to not render before the first resize of the canvas to avoid a glitch
  let isCanvasResized = false;

  const frameContext: UniformContext = {
    time: 0,
    elapsedTime: 0,
    deltaTime: 0,
    canvasResolution: [canvas.width, canvas.height],
    passResolution: [canvas.width, canvas.height],
  };

  function render(options?: RenderOptions) {
    if (disposed || !isCanvasResized) return;
    mainCompositor.render(
      options ?? {
        context: {
          ...frameContext,
          canvasResolution: [...frameContext.canvasResolution],
          passResolution: [...frameContext.passResolution],
        },
      },
    );
  }

  let requestedRender = false;

  /**
   * Request a render to be executed on the next animation frame.
   * If this function is called multiple times before the next animation frame,
   * the render will only be executed once.
   */
  function requestRender() {
    if (disposed || requestedRender || renderMode === "manual") return;
    requestedRender = true;

    renderFrame = requestAnimationFrame(() => {
      requestedRender = false;
      renderFrame = undefined;
      render();
    });
  }

  if (["auto", "continuous"].includes(renderMode)) {
    for (const pass of mainCompositor.allPasses) {
      pass.onUpdated(requestRender);
    }
  }

  const [onCanvasReady, executeCanvasReadyCallbacks] = createHook();

  function setSize({ width, height }: { width: number; height: number }) {
    if (disposed) return;
    setCanvasSize(width, height);
    frameContext.canvasResolution = [width, height];
    frameContext.passResolution = [width, height];
    mainCompositor.setSize({ width, height });
    requestRender();

    if (!isCanvasResized) {
      executeCanvasReadyCallbacks();
      isCanvasResized = true;
    }
  }

  let timeLoop: LoopObj | null = null;
  let play = () => {};
  let pause = () => {};

  if (renderMode === "continuous") {
    timeLoop = loop(
      ({ time, deltaTime, elapsedTime }) => {
        frameContext.time = time;
        frameContext.elapsedTime = elapsedTime;
        frameContext.deltaTime = deltaTime;
        requestRender();
      },
      { immediate },
    );
    ({ play, pause } = timeLoop);
  }

  let resizeObserver: ReturnType<typeof onResize> | null = null;

  if (isOffscreen(canvas) || (canvas.getAttribute("width") && canvas.getAttribute("height"))) {
    setSize({ width: canvas.width, height: canvas.height });
  } else if (renderMode === "manual") {
    setSize({ width: canvas.clientWidth * dpr, height: canvas.clientHeight * dpr });
  } else {
    resizeObserver = onResize(canvas, ({ size }) => {
      setSize({ width: size.width * dpr, height: size.height * dpr });
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (renderFrame != undefined) cancelAnimationFrame(renderFrame);
    timeLoop?.stop();
    resizeObserver?.stop();
    mainCompositor.dispose();
  }

  return {
    gl,
    render,
    onCanvasReady,
    canvas,
    setSize,
    play,
    pause,
    dpr,
    uniforms: renderPass.uniforms,
    onUpdated: renderPass.onUpdated,
    onBeforeRender: mainCompositor.onBeforeRender,
    onAfterRender: mainCompositor.onAfterRender,
    resizeObserver,
    dispose,
  };
};

function inferRenderMode(uniforms: UniformSources<UniformContext> | undefined = {}) {
  const hasDynamicTimeUniform = Object.entries(uniforms).some(
    ([name, value]) => /time/i.test(name) && typeof value === "function",
  );
  return hasDynamicTimeUniform ? "continuous" : "auto";
}

/**
 * @inline
 * @internal
 */
export interface GLCanvasParams<U extends UniformSources<UniformContext>>
  extends
    LoopParams,
    Omit<QuadPassParams<UniformContext, U>, "uniforms">,
    Pick<CompositorParams, "postEffects">,
    Pick<GLContextParams<HTMLCanvasElement | OffscreenCanvas | string>, "canvas" | "colorSpace"> {
  /** Initial uniform sources, including contextual functions and promises. */
  uniforms?: U;
  /**
   * Native WebGL2 context attributes.
   */
  webglAttributes?: WebGL2ContextAttributes;
  /**
   * Device pixel ratio used when sizing a CSS-sized canvas.
   * @default Math.min(globalThis.devicePixelRatio || 1, 2)
   */
  dpr?: number;
  /**
   * Rendering policy.
   * - `auto` schedules renders when needed ((uniform updated, canvas resized, image texture loaded...)
   * - `manual` renders only when {@link GLCanvas.render} is called
   * - `continuous` renders every animation frame.
   * @default `continuous` when the main pass has a uniform function with "time" in its name, otherwise `auto`
   */
  renderMode?: "manual" | "auto" | "continuous";
}

/** The object returned by {@link glCanvas}. */
export type GLCanvas<U extends UniformSources<UniformContext> = UniformSources<UniformContext>> =
  Disposable & {
    /** The WebGL2 rendering context. */
    gl: WebGL2RenderingContext;
    /** Executes one render of the complete pipeline. */
    render: (options?: RenderOptions<UniformContext>) => void;
    /** Registers a callback called after the first canvas resize. */
    onCanvasReady: (callback: () => void) => void;
    /** The HTML canvas or OffscreenCanvas being rendered into. */
    canvas: HTMLCanvasElement | OffscreenCanvas;
    /** Resizes the canvas and every managed render target. */
    setSize: (size: { width: number; height: number }) => void;
    /** Starts the internal animation clock. */
    play: () => void;
    /** Pauses the internal animation clock. */
    pause: () => void;
    /** The device pixel ratio used for CSS-sized canvas resizing. */
    dpr: number;
    /** Reactive proxy containing the main pass's original uniform sources. */
    uniforms: U;
    /** Registers a callback whenever a main-pass uniform source changes. */
    onUpdated: (callback: UpdatedCallback<U>) => void;
    /** Registers a callback before the complete pipeline renders. */
    onBeforeRender: (callback: () => void) => void;
    /** Registers a callback after the complete pipeline renders. */
    onAfterRender: (callback: () => void) => void;
    /** The resize observer, or `null` when sizing is manual or fixed. */
    resizeObserver: ReturnType<typeof onResize> | null;
  };
