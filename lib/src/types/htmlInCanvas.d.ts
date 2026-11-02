/**
 * Type augmentations for the HTML-in-Canvas API (WICG/html-in-canvas).
 *
 * The API is a web platform incubation and is not yet part of TypeScript's DOM
 * lib, so the members Radiance relies on are declared here.
 */

interface HTMLCanvasElement {
  /** Opts direct children of the canvas into layout and hit testing. */
  layoutSubtree: boolean;
  /** Captures a snapshot of a drawable child element. */
  captureElementImage(element: Element): ElementImage;
  /** Updates an element's DOM position, accessibility bounds and hit-test region. */
  updateElementGeometry(element: Element, geometry: UpdateElementGeometryOptions): void;
  /** Clears the geometry state of a drawable element. */
  clearElementGeometry(element: Element): void;
  /** Forces a `paint` event to fire in the next frame. */
  requestPaint(): void;
}

interface WebGL2RenderingContext {
  /**
   * Paints an element's rendering into the currently bound texture.
   * The destination texture storage must be pre-allocated with `texImage2D`.
   */
  texElementSubImage2D(
    target: GLenum,
    level: GLint,
    xoffset: GLint,
    yoffset: GLint,
    source: Element | ElementImage,
  ): void;
}

interface ElementImage {
  readonly width: number;
  readonly height: number;
  close(): void;
}

interface UpdateElementGeometryOptions {
  /**
   * Maps the element's border box (before CSS transforms) to its drawn
   * location in the canvas, in CSS pixels.
   */
  canvasTransform?: DOMMatrixInit;
  /** Hit-test clip, in the coordinate space of `canvasTransform`. */
  clip?: DOMRectInit;
  /** Keep the element where it is in the canvas hit-test order. */
  preserveHitTestOrder?: boolean;
}

interface PaintEvent extends Event {
  readonly changedElements: ReadonlyArray<Element>;
}

interface HTMLElementEventMap {
  paint: PaintEvent;
}
