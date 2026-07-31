import { onResize } from "../helpers/onResize";
import type { LoopObj } from "../helpers/loop";
import { loop, type LoopParams } from "../helpers/loop";
import type { Uniforms } from "../types/types";
import type { Disposable } from "../types/types";
import type { CompositeEffectPass } from "../passes/compositeEffectPass";
import type { EffectPass } from "../passes/effectPass";
import type { UpdatedCallback } from "../passes/renderPass";
import { glContext } from "./glContext";
import type { QuadPassParams } from "../passes/quadRenderPass";
import { quadRenderPass } from "../passes/quadRenderPass";
import { compositor } from "../passes/compositor";
import { findUniformName } from "../internal/findName";
import { createHook } from "../internal/createHook";
import {
  isHTMLImageTexture,
  isHTMLVideoTexture,
  isOffscreen,
  isPromiseLike,
} from "../internal/typeGuards";

/**
 * The main high-level function to manage a WebGL canvas.
 *
 * It combines context creation, a full-screen quad render pass, a post-processing compositor,
 * and automatic rendering/resizing logic.
 */
export const glCanvas = <U extends Uniforms>(params: GLCanvasParams<U>): GLCanvas<U> => {
  const {
    canvas: canvasProp,
    fragment,
    vertex,
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2),
    postEffects = [],
    immediate,
    renderMode = "auto",
    colorSpace,
    webglAttributes,
  } = params;

  const {
    gl,
    canvas,
    setSize: setCanvasSize,
  } = glContext(canvasProp, { ...webglAttributes, colorSpace });

  const renderPass = quadRenderPass(params);
  const mainCompositor = compositor(gl, renderPass, postEffects);
  let disposed = false;
  let renderFrame: number | undefined;
  let timeFrame: number | undefined;
  const imageListeners: Array<{ image: HTMLImageElement; listener: () => void }> = [];
  const videoFrames: Array<{ video: HTMLVideoElement; id: number }> = [];

  // flag to not render before the first resize of the canvas to avoid a glitch
  let isCanvasResized = false;

  function render() {
    if (disposed) return;
    if (isCanvasResized) {
      mainCompositor.render();
    }
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

  if (renderMode === "auto") {
    for (const pass of mainCompositor.allPasses) {
      if (!("uniforms" in pass)) continue;

      pass.onUpdated((name, value) => {
        requestRender();
        watchUniformValue(name, value, pass);
      });

      for (const [name, value] of Object.entries(pass.uniforms)) {
        watchUniformValue(name, value, pass);
      }
    }
  }

  const [onCanvasReady, executeCanvasReadyCallbacks] = createHook();

  function setSize({ width, height }: { width: number; height: number }) {
    if (disposed) return;
    setCanvasSize(width, height);
    mainCompositor.setSize({ width, height });
    requestRender();

    if (!isCanvasResized) {
      executeCanvasReadyCallbacks();
      isCanvasResized = true;
    }
  }

  /**
   * Watch a uniform value for changes that would require re-rendering, such as promises resolving or media loading.
   */
  function watchUniformValue(
    name: string,
    value: unknown,
    pass: { uniforms: Record<string, unknown> },
  ) {
    if (isPromiseLike(value)) {
      value.then((resolvedValue) => {
        if (!disposed) pass.uniforms[name] = resolvedValue;
      });
    } else if (isHTMLImageTexture(value) && !value.src.complete) {
      imageListeners.push({
        image: value.src,
        listener: requestRender,
      });
      value.src.addEventListener("load", requestRender, { once: true });
    } else if (isHTMLVideoTexture(value)) {
      const videoFrame = { video: value.src, id: 0 };
      const onFramePlayed = () => {
        if (disposed) return;
        requestRender();
        videoFrame.id = value.src.requestVideoFrameCallback(onFramePlayed);
      };
      videoFrame.id = value.src.requestVideoFrameCallback(onFramePlayed);
      videoFrames.push(videoFrame);
    }
  }

  const timeUniformName = findUniformName(fragment + vertex, "time");
  let timeLoop: LoopObj | null = null;
  let play = () => {};
  let pause = () => {};

  if (timeUniformName && renderPass.uniforms[timeUniformName] === undefined) {
    timeFrame = requestAnimationFrame(() => {
      // use RAF to avoid triggering an extra render for the initialization of the time uniform
      (renderPass.uniforms as Record<string, number>)[timeUniformName] = 0;
    });

    timeLoop = loop(
      ({ deltaTime }) => {
        (renderPass.uniforms as Record<string, number>)[timeUniformName] += deltaTime / 500;
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
    if (timeFrame != undefined) cancelAnimationFrame(timeFrame);
    timeLoop?.stop();
    resizeObserver?.stop();
    for (const { image, listener } of imageListeners) image.removeEventListener("load", listener);
    for (const { video, id } of videoFrames) video.cancelVideoFrameCallback(id);
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

/**
 * @inline
 * @internal
 */
export interface GLCanvasParams<U extends Uniforms> extends LoopParams, QuadPassParams<U> {
  /**
   * The canvas element to use or CSS selector to query it.
   */
  canvas: HTMLCanvasElement | OffscreenCanvas | string;
  /**
   * Optional WebGL context attributes.
   */
  webglAttributes?: WebGLContextAttributes;
  /**
   * Device Pixel Ratio for the canvas.
   * @default Math.min(globalThis.devicePixelRatio || 1, 2)
   */
  dpr?: number;
  /**
   * An array of post-processing effects to apply.
   */
  postEffects?: Array<EffectPass<any> | CompositeEffectPass<any>>;
  /**
   * Whether to render automatically when needed (uniform updated, canvas resized, image texture loaded...) or manually.
   * @default "auto"
   */
  renderMode?: "manual" | "auto";
  /**
   * Target color space for the drawing buffer.
   */
  colorSpace?: "srgb" | "display-p3";
}

/**
 * The object returned by the {@link glCanvas} function.
 */
export type GLCanvas<U extends Uniforms = Record<string, any>> = Disposable & {
  /** The WebGL2 rendering context. */
  gl: WebGL2RenderingContext;
  /** Executes a single render of the entire pipeline. */
  render: () => void;
  /** Register a callback to execute after the first resizing of the canvas. */
  onCanvasReady: (callback: () => void) => void;
  /** The HTMLCanvasElement or OffscreenCanvas being used. */
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Resizes the canvas and all render targets in the postprocessing chain. */
  setSize: (size: { width: number; height: number }) => void;
  /** Resumes the internal animation loop (if a 'time' uniform is detected). */
  play: () => void;
  /** Pauses the internal animation loop. */
  pause: () => void;
  /** The Device Pixel Ratio being used. */
  dpr: number;
  /** Reactive proxy of the main render pass's uniforms. */
  uniforms: U & Record<string, unknown>;
  /** Registers a callback called whenever a uniform of the main render pass is updated. */
  onUpdated: (callback: UpdatedCallback<U>) => void;
  /** Registers a callback called just before the main render pass is rendered. */
  onBeforeRender: (callback: () => void) => void;
  /** Registers a callback called after the last post-processing effect is rendered. */
  onAfterRender: (callback: () => void) => void;
  /** The resize observer managing the canvas resizing. */
  resizeObserver: ReturnType<typeof onResize> | null;
};
