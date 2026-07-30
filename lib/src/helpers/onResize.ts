/**
 * Dynamically get the size of an HTML element in CSS pixels and device pixels, and update it on resize events.
 */
export function onResize(
  target: HTMLElement,
  callback: (args: {
    /**
     * size of the observed element in CSS pixels
     */
    size: { width: number; height: number };
    /**
     * size of the observed element in device pixels
     */
    devicePixelSize: { width: number; height: number };
    /**
     * untouched, native observer entries
     */
    entries: ResizeObserverEntry[];
  }) => void,
) {
  let size: ResizeObserverSize;
  let devicePixelSize: ResizeObserverSize;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((entry) => entry.target === target)!;

    size = entry.contentBoxSize[0];
    devicePixelSize = entry.devicePixelContentBoxSize?.[0] || {
      blockSize: Math.round(size.blockSize * window.devicePixelRatio),
      inlineSize: Math.round(size.inlineSize * window.devicePixelRatio),
    };

    // call the callback after the next paint, otherwise there are glitches when resizing a canvas
    // with an active render loop
    timeout = setTimeout(() => {
      if (stopped) return;
      callback({
        size: { width: size.inlineSize, height: size.blockSize },
        devicePixelSize: { width: devicePixelSize.inlineSize, height: devicePixelSize.blockSize },
        entries,
      });
    }, 0);
  });

  observer.observe(target);

  return {
    /** Disconnect the resize observer. */
    stop: () => {
      if (stopped) return;
      stopped = true;
      observer.disconnect();
      if (timeout != undefined) clearTimeout(timeout);
    },
    /** Start observing the target element. */
    observe: () => {
      observer.observe(target);
    },
    /** Stop observing the target element. */
    unobserve: () => {
      observer.unobserve(target);
    },
  };
}
