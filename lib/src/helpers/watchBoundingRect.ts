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

  const rect: BoundingRect = {
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    x: 0,
    y: 0,
    center: {
      x: 0,
      y: 0,
    },
  };

  function update() {
    const newRect = target.getBoundingClientRect();

    const boundingRectKeys = Object.keys(rect).filter((key) => key !== "center") as Array<
      keyof Omit<BoundingRect, "center">
    >;

    for (const key of boundingRectKeys) {
      rect[key] = newRect[key];
    }

    rect.center.x = (rect.left + rect.right) / 2;
    rect.center.y = (rect.top + rect.bottom) / 2;
  }

  onResize(target, update);

  if (windowScroll) window.addEventListener("scroll", update, { capture: true, passive: true });
  if (windowResize) window.addEventListener("resize", update, { passive: true });

  return rect as Readonly<BoundingRect>;
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
 * @internal
 */
export type BoundingRect = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  x: number;
  y: number;
  center: {
    x: number;
    y: number;
  };
};
