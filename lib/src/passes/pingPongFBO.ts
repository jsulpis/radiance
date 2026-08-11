import { createRenderTarget } from "../core/renderTarget";
import { createFloatDataTexture, type DataTextureParams } from "../core/texture";
import type { Attribute, UniformContext, UniformSources } from "../types/types";
import type { RenderPass } from "./renderPass";
import { quadRenderPass } from "./quadRenderPass";
import type { RenderOptions } from "./rawRenderPass";

/**
 * Creates a ping-pong Framebuffer Object (FBO) pass for GPGPU calculations.
 *
 * This pattern uses two textures (read and write) that are swapped at each render call.
 * It is commonly used for particle simulations, fluid dynamics, or any iterative process.
 *
 * - [Example: Particles](/examples/gpgpu/particles/)
 * - [Example: Boids](/examples/gpgpu/boids/)
 * - [Example: Game of Life](/examples/gpgpu/game-of-life/)
 *
 * @param params - Configuration for the ping-pong pass.
 * @returns A {@link RenderPass} object specialized for double-buffering.
 */
export function pingPongFBO<U extends UniformSources<UniformContext>>({
  gl,
  uniforms = {} as U,
  dataTexture,
  fragment,
}: PingPongFBOParams<U>) {
  // add the ability to render to 32-bit floating-point buffers
  gl.getExtension("EXT_color_buffer_float");

  const { initialData, name: dataTextureName = "tData" } = dataTexture;
  const elementsCount = initialData.length / 4;

  const initialDataTexture = createFloatDataTexture(initialData);
  const { data: _, ...textureParams } = initialDataTexture;

  const coords = new Float32Array(elementsCount * 2);
  for (let i = 0; i < elementsCount; i++) {
    const u = (i % textureParams.width) / textureParams.width;
    const v = Math.floor(i / textureParams.width) / textureParams.height;
    coords.set([u, v], i * 2);
  }

  const fboPass = quadRenderPass({
    gl,
    fragment,
    uniforms: Object.assign(uniforms, {
      [dataTextureName]: initialDataTexture,
    }),
  });

  const pingPongFBOPass: PingPongFBOPass<U> = Object.assign(fboPass, {
    texture: initialDataTexture,
    coords: {
      data: coords,
      size: 2,
    },
  });

  let fboRead = createRenderTarget(gl, textureParams);
  let fboWrite = createRenderTarget(gl, textureParams);

  function swap() {
    const temp = fboRead;
    fboRead = fboWrite;
    fboWrite = temp;
  }

  const renderFn = pingPongFBOPass.render;

  pingPongFBOPass.render = (options: RenderOptions = {}) => {
    renderFn({ ...options, target: fboWrite });
    pingPongFBOPass.texture = fboWrite.texture;
    Object.assign(pingPongFBOPass.uniforms, {
      [dataTextureName]: () => fboRead.texture,
    });
    swap();
  };

  pingPongFBOPass.onDispose(() => {
    fboRead.dispose();
    fboWrite.dispose();
  });

  return pingPongFBOPass;
}

export type PingPongFBOPass<U extends UniformSources<UniformContext> = Record<string, never>> =
  RenderPass<U> & {
    /** The current output texture after the most recent render. */
    texture: DataTextureParams | WebGLTexture;
    /** Pre-calculated UV coordinates for sampling the simulation texture. */
    coords: Attribute;
  };

/**
 * Params for the ping-pong FBO pattern.
 * @inline
 * @internal
 */
export type PingPongFBOParams<U extends UniformSources<UniformContext> = Record<string, never>> = {
  /** WebGL2 context. */
  gl: WebGL2RenderingContext;
  /** Uniform sources for the simulation pass. */
  uniforms?: U;
  /** Fragment shader source. Should read from `dataTexture.name`. */
  fragment: string;
  /** Initial data and uniform name for the double-buffered texture. */
  dataTexture: {
    /** The name of the sampler2D uniform in the fragment shader. Defaults to "tData". */
    name?: string;
    /** The raw numerical data to seed the initial texture state. */
    initialData: Float32Array | number[];
  };
};
