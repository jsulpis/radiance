import { fxaa, glCanvas, loop, onPointerEvents, quadRenderPass } from "@radiancejs/gl";
import fragment from "./scene.frag?raw";
import "./styles.css";

// Fast Approximate Anti-Aliasing (FXAA)

let threshold = 0.5;

const canvas = document.querySelector("canvas")!;

const withFxaa = glCanvas({
  canvas,
  dpr: 1,
  fragment,
  uniforms: {
    uTime: 0,
    uThreshold: () => threshold,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
  postEffects: [fxaa()],
});

const { gl } = withFxaa;

const withoutFxaa = quadRenderPass({
  gl,
  fragment,
  uniforms: {
    uTime: 0,
    uThreshold: () => threshold,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});

gl.enable(gl.SCISSOR_TEST);

loop(({ time }) => {
  withFxaa.uniforms.uTime = time / 1000;
  withoutFxaa.uniforms.uTime = time / 1000;

  const thresholdPx = Math.floor(withFxaa.canvas.width * threshold);

  gl.scissor(thresholdPx, 0, withFxaa.canvas.width - thresholdPx, withFxaa.canvas.height);
  withFxaa.render();

  gl.scissor(0, 0, thresholdPx, withFxaa.canvas.height);
  withoutFxaa.render();
});

onPointerEvents(canvas, {
  move: ({ pointer, boundingRect }) => {
    threshold = (pointer.x - boundingRect.left) / boundingRect.width;
  },
  leave: () => {
    threshold = 0.5;
  },
});
