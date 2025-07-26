import type { BoundingRect } from "./watchBoundingRect";
import { watchBoundingRect } from "./watchBoundingRect";

/**
 * Listen to pointer events on a canvas and provide the pointer position, canvas bounding rect and center to the handlers.
 */
export function onPointerEvents(element: HTMLElement, handlers: PointerEventsHandlers) {
  const boundingRect = watchBoundingRect(element);

  const activeHandlers = Object.fromEntries(
    Object.entries(handlers)
      .filter(([, handler]) => typeof handler === "function")
      .map(([handlerName, handlerFunction]) => [
        handlerName,
        (e: PointerEvent) => {
          handlerFunction({
            pointer: { x: e.clientX, y: e.clientY },
            boundingRect,
          });
        },
      ]),
  );

  function listen() {
    for (const [event, handler] of Object.entries(activeHandlers)) {
      element.addEventListener(`pointer${event as keyof PointerEventsHandlers}`, handler, {
        passive: true,
      });
    }
  }

  function stop() {
    for (const [event, handler] of Object.entries(activeHandlers)) {
      element.removeEventListener(`pointer${event as keyof PointerEventsHandlers}`, handler);
    }
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
  boundingRect: BoundingRect;
};
