import type { ElementTextureParams, ImageTextureParams } from "../core/texture";

export function isHTMLImageTexture(params: any): params is ImageTextureParams<HTMLImageElement> {
  return (
    typeof HTMLImageElement !== "undefined" &&
    isObjectWithProperty(params, "src") &&
    params.src instanceof HTMLImageElement
  );
}

export function isHTMLVideoTexture(params: any): params is ImageTextureParams<HTMLVideoElement> {
  return (
    typeof HTMLVideoElement !== "undefined" &&
    isObjectWithProperty(params, "src") &&
    params.src instanceof HTMLVideoElement
  );
}

export function isElementTexture(params: any): params is ElementTextureParams {
  return (
    typeof HTMLElement !== "undefined" &&
    isObjectWithProperty(params, "src") &&
    params.src instanceof HTMLElement &&
    // elements which are valid TexImageSource keep going through the media path
    !(params.src instanceof HTMLImageElement) &&
    !(params.src instanceof HTMLVideoElement) &&
    !(params.src instanceof HTMLCanvasElement)
  );
}

export function isOffscreen(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): canvas is OffscreenCanvas {
  return typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas;
}

export function isPromiseLike(value: any): value is PromiseLike<unknown> & object {
  return isObjectWithProperty(value, "then") && typeof value.then === "function";
}

export function isObjectWithProperty(obj: unknown, key: string) {
  return obj != null && typeof obj === "object" && key in obj;
}
