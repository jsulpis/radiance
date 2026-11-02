import {
  GL_CLAMP_TO_EDGE,
  GL_FLOAT,
  GL_LINEAR,
  GL_LINEAR_MIPMAP_LINEAR,
  GL_MIRRORED_REPEAT,
  GL_NEAREST,
  GL_NEAREST_MIPMAP_LINEAR,
  GL_REPEAT,
  GL_RGBA,
  GL_RGBA32F,
  GL_SRGB8_ALPHA8,
  GL_TEXTURE_2D,
  GL_TEXTURE_MAG_FILTER,
  GL_TEXTURE_MIN_FILTER,
  GL_TEXTURE_WRAP_S,
  GL_TEXTURE_WRAP_T,
  GL_UNPACK_FLIP_Y_WEBGL,
  GL_UNSIGNED_BYTE,
} from "./constants";
import {
  isElementTexture,
  isHTMLImageTexture,
  isHTMLVideoTexture,
  isOffscreen,
} from "../internal/typeGuards";

const minFilterMap: Record<MinFilter, number> = {
  linear: GL_LINEAR,
  nearest: GL_NEAREST,
  "linear-mipmap-linear": GL_LINEAR_MIPMAP_LINEAR,
  "nearest-mipmap-linear": GL_NEAREST_MIPMAP_LINEAR,
};

const magFilterMap: Record<MagFilter, number> = {
  linear: GL_LINEAR,
  nearest: GL_NEAREST,
};

const wrapMap: Record<WrappingMode, number> = {
  "clamp-to-edge": GL_CLAMP_TO_EDGE,
  repeat: GL_REPEAT,
  "mirrored-repeat": GL_MIRRORED_REPEAT,
};

/**
 * Given a WebGL2RenderingContext and a WebGLTexture, fill the texture with the given parameters.
 *
 * - if a src is provided with a loaded media, it will be uploaded directly
 * - if the src is an HTMLImageElement or HTMLVideoElement which is not loaded yet, a single black pixel is uploaded
 * - if no src is provided, the data parameter will be used (with default to a single black pixel)
 *
 * @internal
 * @param gl - The WebGL2 context.
 * @param texture - The WebGL texture to fill.
 * @param params - Configuration parameters for the texture.
 */
export function fillTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  params: TextureParams,
) {
  const isLoadingMedia =
    (isHTMLImageTexture(params) && !params.src.complete) ||
    (isHTMLVideoTexture(params) && params.src.readyState < 3);
  const isLoadedMedia = "src" in params && params.src != undefined && !isLoadingMedia;

  const {
    level = 0,
    flipY = true,
    format = GL_RGBA,
    colorSpace = "linear-rgb",
    internalFormat = colorSpace === "srgb" ? GL_SRGB8_ALPHA8 : GL_RGBA,
    type = GL_UNSIGNED_BYTE,
    generateMipmaps = "src" in params && params.src != null, // no mipmap for data textures
    anisotropy = 1,
    minFilter = generateMipmaps ? "linear-mipmap-linear" : "linear",
    magFilter = "linear",
    wrapS = "clamp-to-edge",
    wrapT = "clamp-to-edge",
  } = params;

  gl.bindTexture(GL_TEXTURE_2D, texture);
  gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, flipY);

  if (isElementTexture(params)) {
    fillElementTexture(gl, texture, params.src, level, internalFormat, format, type);
  } else if (isLoadedMedia) {
    gl.texImage2D(GL_TEXTURE_2D, level, internalFormat, format, type, params.src);
  } else {
    const dataTexture = (params || {}) as DataTextureParams;
    const { data = new Uint8Array([0, 0, 0, 255]), width = 1, height = 1 } = dataTexture;
    gl.texImage2D(GL_TEXTURE_2D, level, internalFormat, width, height, 0, format, type, data);
  }

  if (generateMipmaps) {
    gl.generateMipmap(GL_TEXTURE_2D);

    // anisotropic filtering
    if (anisotropy > 1) {
      const ext = gl.getExtension("EXT_texture_filter_anisotropic");
      if (ext) {
        const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.texParameterf(
          GL_TEXTURE_2D,
          ext.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(maxAnisotropy, anisotropy),
        );
      }
    }
  }

  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, minFilterMap[minFilter]);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, magFilterMap[magFilter]);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, wrapMap[wrapS]);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, wrapMap[wrapT]);
}

const blackPixel = new Uint8Array([0, 0, 0, 255]);

// ponytail: storage allocation is tracked per texture only to know when the
// element grew; a full resize-tracking system is not worth it.
const elementStorageAllocations = new WeakMap<WebGLTexture, { width: number; height: number }>();

function fillElementTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  element: HTMLElement,
  level: number,
  internalFormat: number,
  format: number,
  type: number,
) {
  const canvas = gl.canvas;

  if (
    typeof gl.texElementSubImage2D !== "function" ||
    isOffscreen(canvas) ||
    typeof canvas.captureElementImage !== "function"
  ) {
    console.error("The HTML-in-Canvas API is not available.");
    gl.texImage2D(GL_TEXTURE_2D, level, internalFormat, 1, 1, 0, format, type, blackPixel);
    return;
  }

  let elementImage: ElementImage;
  try {
    elementImage = canvas.captureElementImage(element);
  } catch {
    // no snapshot recorded yet: the paint event will schedule another upload
    return;
  }
  const width = Math.ceil(elementImage.width);
  const height = Math.ceil(elementImage.height);
  elementImage.close();

  if (width < 1 || height < 1 || element.offsetWidth < 1 || element.offsetHeight < 1) return;

  const allocated = elementStorageAllocations.get(texture);
  if (allocated == null || allocated.width !== width || allocated.height !== height) {
    gl.texImage2D(GL_TEXTURE_2D, level, internalFormat, width, height, 0, format, type, null);
    elementStorageAllocations.set(texture, { width, height });
  }

  gl.texElementSubImage2D(GL_TEXTURE_2D, level, 0, 0, element);
}

/**
 * Loads an image from a URL and returns a Promise resolving to {@link ImageTextureParams}.
 * @param src - URL of the image.
 * @param params - Additional texture parameters.
 */
export async function loadTexture(
  src: string,
  params?: BaseTextureParams,
): Promise<ImageTextureParams<ImageBitmap>> {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to load texture: ${src}`);
  }
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: params?.flipY === false ? "none" : "flipY",
  });

  return { ...params, src: bitmap };
}

/**
 * Loads a video from a URL and returns {@link ImageTextureParams}.
 * @param src - URL of the video.
 * @param params - Additional video loading options.
 */
export function loadVideoTexture(
  src: string,
  params?: LoadVideoParams,
): ImageTextureParams<HTMLVideoElement> {
  if (typeof document === "undefined") {
    throw new TypeError("loadVideoTexture requires a document context.");
  }

  const video = document.createElement("video");

  video.loop = true;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;

  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("muted", "");
  video.setAttribute("loop", "");
  video.setAttribute("autoplay", "");

  if (src.startsWith("http") && new URL(src).origin !== globalThis.location.origin) {
    video.crossOrigin = "anonymous";
  }

  const onReady = () => {
    const startVideo = () => {
      video.play();
    };
    if (params?.startTime && params?.startTime > 0) {
      video.currentTime = params.startTime;
      video.addEventListener("seeked", startVideo, { once: true });
    } else {
      startVideo();
    }
    video.removeEventListener("error", onerror);
  };

  const onerror = () => {
    console.error(`Failed to load texture: ${src}`);
    video.removeEventListener("canplay", onReady);
  };

  video.addEventListener("canplay", onReady, { once: true });
  video.addEventListener("error", onerror, { once: true });

  video.src = src;
  video.load();

  return { ...params, src: video };
}

/**
 * Creates texture parameters for a float data texture.
 * Useful for passing arbitrary numerical data to shaders.
 *
 * [Example: particles](/examples/gpgpu/particles/)
 *
 * @param data - Flat array or Float32Array of data. Must have 4 components per element (RGBA).
 */
export function createFloatDataTexture(data: number[] | Float32Array): DataTextureParams {
  const elementsCount = data.length / 4;
  const textureWidth = Math.ceil(Math.sqrt(elementsCount));
  const textureHeight = Math.ceil(elementsCount / textureWidth);

  let dataArray: Float32Array;
  if (data.length === textureWidth * textureHeight * 4) {
    dataArray = data instanceof Float32Array ? data : new Float32Array(data);
  } else {
    dataArray = new Float32Array(textureWidth * textureHeight * 4).map(() => -1);
    dataArray.set(data);
  }

  return {
    data: dataArray,
    format: GL_RGBA,
    type: GL_FLOAT,
    internalFormat: GL_RGBA32F,
    width: textureWidth,
    height: textureHeight,
    minFilter: "nearest",
    magFilter: "nearest",
    flipY: false,
  };
}

/**
 * Places an element drawn on a quad of a 3D scene where the quad appears on screen, so its
 * DOM position, hit testing and accessibility bounds follow the pixels.
 *
 * The quad's vertices must span `[-1, 1]` on both axes, since the whole texture is drawn over it.
 * Scale the quad to the element's aspect ratio to avoid distortion. Call it after every render:
 *
 * ```ts
 * glc.onAfterRender(() => updateElementMatrix(card, mvpMatrix));
 * ```
 *
 * @param element - The element drawn as a texture.
 * @param mvpMatrix - The element's model-view-projection matrix, as a flat column-major array of 16 numbers (as WebGL expects). Transpose row-major matrices first.
 */
export function updateElementMatrix(element: HTMLElement, mvpMatrix: ArrayLike<number>) {
  const canvas = element.closest("canvas");
  if (typeof canvas?.updateElementGeometry !== "function") return;
  if (element.offsetWidth < 1 || element.offsetHeight < 1) return;

  // element border box in CSS px (y down) -> quad local space [-1, 1] (y up)
  const boxToQuad = new DOMMatrix()
    .translateSelf(-1, 1)
    .scaleSelf(2 / element.offsetWidth, -2 / element.offsetHeight);

  // quad local space -> clip space (NDC), column-major input as WebGL expects
  const mvp = DOMMatrix.fromFloat32Array(new Float32Array(mvpMatrix));

  // NDC [-1, 1] -> canvas CSS pixels, y flipped back to top-down
  const viewport = new DOMMatrix()
    .translateSelf(
      canvas.clientLeft + canvas.clientWidth / 2,
      canvas.clientTop + canvas.clientHeight / 2,
    )
    .scaleSelf(canvas.clientWidth / 2, -canvas.clientHeight / 2);

  // applied right to left: box -> quad -> clip (NDC) -> canvas CSS px
  const canvasTransform = viewport.multiply(mvp).multiply(boxToQuad);

  canvas.updateElementGeometry(element, { canvasTransform });
}

/**
 * Places an element drawn as a 2D rectangle of the canvas, so its DOM position, hit testing
 * and accessibility bounds follow the pixels. Coordinates are CSS pixels relative to the canvas,
 * with the origin at the top left. Call it after every render:
 *
 * ```ts
 * glc.onAfterRender(() => updateElementRect(lens, { x: pointer.x, y: pointer.y, width: 160, height: 160 }));
 * ```
 *
 * @param element - The element drawn as a texture.
 * @param rect - Where the element is drawn in the canvas. `width` and `height` default to the element's current size.
 */
export function updateElementRect(element: HTMLElement, rect: ElementRectParams) {
  const canvas = element.closest("canvas");
  if (typeof canvas?.updateElementGeometry !== "function") return;
  if (element.offsetWidth < 1 || element.offsetHeight < 1) return;

  const width = rect.width ?? element.offsetWidth;
  const height = rect.height ?? element.offsetHeight;

  // border box (top-left at 0,0) -> rect in canvas CSS px
  const canvasTransform = new DOMMatrix()
    .translateSelf(rect.x, rect.y)
    .scaleSelf(width / element.offsetWidth, height / element.offsetHeight);

  canvas.updateElementGeometry(element, { canvasTransform });
}

/** @inline */
type MagFilter = "linear" | "nearest";

/** @inline */
type MinFilter = "linear" | "nearest" | "linear-mipmap-linear" | "nearest-mipmap-linear";

/** @inline */
type ColorSpace = "srgb" | "linear-rgb";

/** @inline */
type WrappingMode = "clamp-to-edge" | "repeat" | "mirrored-repeat";

/**
 * Base parameters for configuring a WebGL texture.
 */
export type BaseTextureParams = {
  /**
   * Texture minification filter.
   * @default "linear-mipmap-linear" if generateMipmaps is true, "linear" otherwise
   */
  minFilter?: MinFilter;
  /**
   * Texture magnification filter.
   * @default "linear"
   */
  magFilter?: MagFilter;
  /**
   * Wrapping mode for the S (U) coordinate.
   * @default "clamp-to-edge"
   */
  wrapS?: WrappingMode;
  /**
   * Wrapping mode for the T (V) coordinate.
   * @default "clamp-to-edge"
   */
  wrapT?: WrappingMode;
  /**
   * Whether to automatically generate mipmaps for this texture.
   * @default true
   */
  generateMipmaps?: boolean;
  /**
   * Level of anisotropic filtering to apply.
   * @default 1 (no anisotropic filtering)
   */
  anisotropy?: number;
  /**
   * Whether to flip the image's Y axis to match WebGL's coordinate system.
   * @default true
   */
  flipY?: boolean;
  /**
   * The mipmap level to fill.
   * @default 0
   */
  level?: number;
  /**
   * The internal format of the texture in the GPU.
   * @default RGBA
   */
  internalFormat?: number;
  /**
   * The color space of the input data.
   * @default "linear-rgb"
   */
  colorSpace?: ColorSpace;
  /**
   * The format of the texel data.
   * @default RGBA
   */
  format?: number;
  /**
   * The data type of the texel data.
   * @default UNSIGNED_BYTE
   */
  type?: number;
};

/**
 * Parameters for creating a texture from raw data (TypedArray).
 * @see {@link BaseTextureParams}
 */
export type DataTextureParams = BaseTextureParams & {
  /**
   * A typed array of texture data used to fill the texture.
   */
  data: ArrayBufferView | null;
  /**
   * The width of the texture in pixels.
   */
  width: number;
  /**
   * The height of the texture in pixels.
   */
  height: number;
};

/**
 * Parameters for creating a texture from an external source (Image, Video, etc.).
 * @see {@link BaseTextureParams}
 */
export type ImageTextureParams<S extends TexImageSource = TexImageSource> = BaseTextureParams & {
  /**
   * A source of texture: image, video, canvas, etc.
   */
  src: S;
};

/**
 * Parameters for creating a texture from a live DOM element using the HTML-in-canvas API.
 * The element needs the `drawable` attribute, and its canvas the `layoutsubtree` attribute.
 * @see {@link BaseTextureParams}
 */
export type ElementTextureParams<S extends HTMLElement = HTMLElement> = BaseTextureParams & {
  /**
   * The DOM element to paint into the texture.
   */
  src: S;
};

/**
 * Union type of all possible texture configuration parameters.
 */
export type TextureParams = DataTextureParams | ImageTextureParams | ElementTextureParams;

/**
 * Placement of an element drawn as a 2D rectangle of the canvas, in CSS pixels.
 * @see {@link updateElementRect}
 */
export type ElementRectParams = {
  /** Left edge, relative to the canvas. */
  x: number;
  /** Top edge, relative to the canvas. */
  y: number;
  /**
   * Width of the drawn rectangle.
   * @default the element's current width
   */
  width?: number;
  /**
   * Height of the drawn rectangle.
   * @default the element's current height
   */
  height?: number;
};

/**
 * Parameters for loading a video texture.
 * @see {@link BaseTextureParams}
 */
export type LoadVideoParams = BaseTextureParams & {
  /**
   * Timecode in seconds from which to start the video.
   * @default 0
   */
  startTime?: number;
};
