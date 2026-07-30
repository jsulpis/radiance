import type { ElementBoundingRect, ElementCenter } from "./watchBoundingRect";
import { watchBoundingRect } from "./watchBoundingRect";

/**
 * Listen to pointer events on an element and provide the pointer position, element bounding rect and center to the handlers.
 */
export function onPointerEvents(element: HTMLElement, handlers: PointerEventsHandlers) {
  const { rect: boundingRect, center, stop: stopBoundingRect } = watchBoundingRect(element);
  let stopped = false;

  const activeHandlers = Object.fromEntries(
    Object.entries(handlers)
      .filter(([, handler]) => typeof handler === "function")
      .map(([handlerName, handlerFunction]) => [
        handlerName,
        (e: PointerEvent) => {
          handlerFunction({
            pointer: { x: e.clientX, y: e.clientY },
            boundingRect,
            center,
          });
        },
      ]),
  );

  function listen() {
    if (stopped) return;
    for (const [event, handler] of Object.entries(activeHandlers)) {
      element.addEventListener(`pointer${event as keyof PointerEventsHandlers}`, handler, {
        passive: true,
      });
    }
  }

  function removeListeners() {
    for (const [event, handler] of Object.entries(activeHandlers)) {
      element.removeEventListener(`pointer${event as keyof PointerEventsHandlers}`, handler);
    }
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    removeListeners();
    stopBoundingRect();
  }

  listen();

  return { stop, listen };
}

/**
 * @inline
 * @internal
 */
export interface PointerEventsHandlers {
  enter?: (args: HandlerArgs) => void;
  move?: (args: HandlerArgs) => void;
  leave?: (args: HandlerArgs) => void;
  down?: (args: HandlerArgs) => void;
  up?: (args: HandlerArgs) => void;
}

export type HandlerArgs = {
  pointer: {
    x: number;
    y: number;
  };
  boundingRect: ElementBoundingRect;
  center: ElementCenter;
};
