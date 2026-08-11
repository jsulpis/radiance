import type { UniformContext } from "../types/types";

/** Creates the base context used when a render call has no frame context. */
export function createUniformContext(gl: WebGL2RenderingContext): UniformContext {
  const resolution: [number, number] = [gl.canvas.width, gl.canvas.height];

  return {
    time: 0,
    deltaTime: 0,
    elapsedTime: 0,
    canvasResolution: resolution,
    passResolution: [...resolution],
  };
}
