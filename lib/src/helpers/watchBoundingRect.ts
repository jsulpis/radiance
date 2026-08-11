import { onResize } from "./onResize";

/**
 * Watch the bounding rect of an element and update it on resize and scroll events.
 * @internal
 */
export function watchBoundingRect(target: HTMLElement, params: WatchBoundingRectParams = {}) {
  const {
    windowResize = globalThis.window !== undefined,
    windowScroll = globalThis.window !== undefined,
  } = params;

  const rect: ElementBoundingRect = {
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    x: 0,
    y: 0,
  };

  const center = { x: 0, y: 0 };

  function update() {
    const newRect = target.getBoundingClientRect();

    const boundingRectKeys = Object.keys(rect) as Array<keyof ElementBoundingRect>;

    for (const key of boundingRectKeys) {
      rect[key] = newRect[key];
    }

    center.x = (rect.left + rect.right) / 2;
    center.y = (rect.top + rect.bottom) / 2;
  }

  const resizeObserver = onResize(target, update);

  if (windowScroll) window.addEventListener("scroll", update, { capture: true, passive: true });
  if (windowResize) window.addEventListener("resize", update, { passive: true });

  return {
    /** The current bounding rect of the element. */
    rect: rect as Readonly<ElementBoundingRect>,
    /** The current center of the element. */
    center: center as Readonly<ElementCenter>,
    /** Stop watching the bounding rect and remove event listeners. */
    stop() {
      resizeObserver.stop();
      if (windowScroll) window.removeEventListener("scroll", update, { capture: true });
      if (windowResize) window.removeEventListener("resize", update);
    },
  };
}

/**
 * @internal
 */
export interface WatchBoundingRectParams {
  /**
   * Listen to window resize event
   *
   * @default true
   */
  windowResize?: boolean;
  /**
   * Listen to window scroll event
   *
   * @default true
   */
  windowScroll?: boolean;
}

/**
 * @inline
 * @internal
 */
export type ElementBoundingRect = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  x: number;
  y: number;
};

/**
 * @inline
 * @internal
 */
export type ElementCenter = {
  x: number;
  y: number;
};
