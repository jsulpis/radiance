import { isHTMLImageTexture, isHTMLVideoTexture, isPromiseLike } from "./typeGuards";
import type { UniformSource, UniformValue, UniformValues } from "../types/types";
import type { UpdatedCallback } from "../passes/rawRenderPass";
import { createHook } from "./createHook";

/**
 * Resolves managed uniform sources (promises, functions, media) and notifies consumers when their values
 * become available or need another render.
 */
export function uniformRuntime<Context, U extends Record<string, any>>(sources: U) {
  type Name = Extract<keyof U, string>;

  // Latest concrete values ready to be passed to the render pass.
  const values: UniformValues = {};
  // Generation tokens invalidate stale promise results when sources change.
  const pending = new Map<Name, number>();
  // Cleanup callbacks for active image-load and video-frame listeners.
  const mediaCleanups = new Map<Name, () => void>();
  // Last media value watched for each uniform, preventing duplicate listeners.
  const mediaValues = new Map<Name, UniformValue | undefined>();

  const [onUpdated, executeUpdated] = createHook<UpdatedCallback<U>>();
  let disposed = false;

  const sourceProxy = new Proxy(
    { ...sources },
    {
      set(target, name: Name, value: U[Name]) {
        if (value === target[name]) return true;
        const oldValue = target[name];
        target[name] = value;
        cleanupMedia(name);
        resolveSource(name, value);
        executeUpdated(name, value, oldValue);
        return true;
      },
    },
  ) as U;

  for (const [name, source] of Object.entries(sourceProxy) as Array<[Name, U[Name]]>) {
    resolveSource(name, source);
  }

  /** Re-evaluates contextual sources for the current render. */
  function resolve(context?: Readonly<Context>) {
    for (const [name, source] of Object.entries(sourceProxy) as Array<[Name, U[Name]]>) {
      if (typeof source === "function") {
        const value = source(context);
        values[name] = value;
        watchMedia(name, value);
      }
    }
  }

  /** Tracks promises by generation so stale results cannot overwrite newer sources. */
  function resolveSource(name: Name, source: UniformSource<Context>) {
    if (isPromiseLike(source)) {
      const token = (pending.get(name) || 0) + 1;
      pending.set(name, token);
      source.then(
        (value) => {
          if (disposed || pending.get(name) !== token) return;
          pending.delete(name);
          const resolvedValue = value as UniformValue;
          values[name] = resolvedValue;
          watchMedia(name, resolvedValue as U[Name]);
          executeUpdated(name, resolvedValue as U[Name], undefined);
        },
        (error) => {
          if (disposed || pending.get(name) !== token) return;
          pending.delete(name);
          console.error(`Uniform "${name}" could not be resolved.`, error);
        },
      );
      return;
    }

    pending.delete(name);

    if (typeof source === "function") return;

    values[name] = source;
    watchMedia(name, source as U[Name]);
  }

  /** Subscribes to image-load and video-frame events for media uniforms. */
  function watchMedia(name: Name, value: U[Name] | undefined) {
    if (mediaValues.get(name) === value) return;
    cleanupMedia(name);
    mediaValues.set(name, value);
    if (value == null || typeof value !== "object") return;

    if (isHTMLImageTexture(value) && !value.src.complete) {
      const listener = () => {
        mediaCleanups.delete(name);
        executeUpdated(name, value, undefined);
      };
      value.src.addEventListener("load", listener, { once: true });
      mediaCleanups.set(name, () => value.src.removeEventListener("load", listener));
    } else if (isHTMLVideoTexture(value)) {
      const video = value.src;
      let frameId = 0;
      const onFrame = () => {
        if (disposed) return;
        executeUpdated(name, value, undefined);
        frameId = video.requestVideoFrameCallback(onFrame);
      };
      frameId = video.requestVideoFrameCallback(onFrame);
      mediaCleanups.set(name, () => video.cancelVideoFrameCallback(frameId));
    }
  }

  /** Removes any browser event or video-frame subscription for a uniform. */
  function cleanupMedia(name: Name) {
    mediaCleanups.get(name)?.();
    mediaCleanups.delete(name);
    mediaValues.delete(name);
  }

  /** Returns the latest concrete values without exposing the mutable value map. */
  function getValuesSnapshot() {
    return Object.freeze({ ...values });
  }

  /** Stops pending async updates and releases media listeners. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const name of mediaCleanups.keys()) cleanupMedia(name);
    pending.clear();
  }

  return {
    uniformsProxy: sourceProxy,
    onUpdated,
    resolve,
    getValues: () => values,
    getValuesSnapshot,
    dispose,
  };
}

export type ManagedUniformSource<Context> = UniformSource<Context>;
