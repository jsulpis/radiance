import { createRenderTarget } from "../core/renderTarget";
import { createFloatDataTexture, type DataTextureParams } from "../core/texture";
import type { Attribute, Uniforms } from "../types/types";
import { quadRenderPass } from "./quadRenderPass";
import type { RenderPass } from "./renderPass";

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
export function pingPongFBO<U extends Uniforms>({
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

  pingPongFBOPass.render = () => {
    renderFn({ target: fboWrite });
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

export type PingPongFBOPass<U extends Uniforms = Record<string, never>> = RenderPass<U> & {
  /** The current output texture after a render. */
  texture: DataTextureParams | WebGLTexture;
  /** Pre-calculated UV coordinates for sampling data from the texture. */
  coords: Attribute;
};

/**
 * Params for the ping-pong FBO pattern.
 * @inline
 * @internal
 */
export type PingPongFBOParams<U extends Uniforms = Record<string, never>> = {
  /** WebGL2 context. */
  gl: WebGL2RenderingContext;
  /** Uniforms for the pass. */
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
