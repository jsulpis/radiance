/**
 * Initializes a WebGL2 rendering context for a given canvas.
 *
 * @param params - Canvas and WebGL2 context configuration.
 * @throws Error if the canvas or WebGL2 context could not be created.
 */
export function glContext<T extends HTMLCanvasElement | OffscreenCanvas | string>({
  canvas,
  ...params
}: GLContextParams<T>) {
  let canvasElement: HTMLCanvasElement | OffscreenCanvas | null = null;

  if (typeof canvas === "string") {
    if (typeof document !== "undefined") {
      canvasElement = document.querySelector<HTMLCanvasElement>(canvas);
    }
  } else {
    canvasElement = canvas;
  }

  if (canvasElement == null) {
    throw new Error("Canvas element not found.");
  }

  const gl = canvasElement.getContext("webgl2", params) as WebGL2RenderingContext;
  if (!gl) {
    throw new Error("No WebGL2 context available.");
  }

  if ("drawingBufferColorSpace" in gl && params?.colorSpace != undefined) {
    gl.drawingBufferColorSpace = params.colorSpace;
  }

  function setSize(width: number, height: number) {
    canvasElement!.width = width;
    canvasElement!.height = height;
    gl.viewport(0, 0, width, height);
  }

  return {
    gl,
    canvas: canvasElement as T extends OffscreenCanvas ? OffscreenCanvas : HTMLCanvasElement,
    setSize,
  };
}

/**
 * Configuration params for the WebGL2 context.
 * @inline
 * @internal
 */
export interface GLContextParams<
  T extends HTMLCanvasElement | OffscreenCanvas | string,
> extends WebGL2ContextAttributes {
  /** The canvas element to use or CSS selector to query it. */
  canvas: T;
  /**
   * The color space to use for the drawing buffer.
   */
  colorSpace?: "srgb" | "display-p3";
}

/**
 * Native WebGL2 context attributes.
 * @inline
 * @internal
 */
export type WebGL2ContextAttributes = {
  alpha?: boolean;
  antialias?: boolean;
  depth?: boolean;
  desynchronized?: boolean;
  failIfMajorPerformanceCaveat?: boolean;
  powerPreference?: "default" | "high-performance" | "low-power";
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
};
