import { glCanvas } from "@radiancejs/gl";
import "./styles.css";

const { onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 uv; // provided by the default vertex shader
    uniform vec2 resolution;
    #define RADIUS .2

    void main() {
      vec2 center = resolution / 2.;
      float dist = distance(uv * resolution, center);
      float radiusPx = min(resolution.x, resolution.y) * RADIUS;
      float circleMask = 1. - smoothstep(radiusPx * .99, radiusPx * 1.01, dist);
      vec2 circleUv = (uv * resolution - center) / radiusPx;
      vec3 color = vec3((circleUv + 1.) * .5, 1.) * circleMask;
      gl_FragColor = vec4(color, 1.);
    }
  `,
  uniforms: {
    resolution: ({ canvasResolution }) => canvasResolution,
  },
});

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.firstChild!.nodeValue = `${Number(renderCount.textContent) + 1}`;
});

/**
 * When resizing the window (or just the canvas):
 * - The canvas size is updated
 * - The resolution uniform is updated
 * - The scene is re-rendered
 */
