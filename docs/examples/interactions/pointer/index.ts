import { glCanvas, loop, onPointerEvents } from "@radiancejs/gl";
import "./styles.css";

const canvas = document.querySelector("canvas")!;

const { uniforms, onAfterRender } = glCanvas({
  canvas,
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform vec2 uPointerPosition;
    uniform vec2 uResolution;
    uniform vec3 uCircleColor;

    void main() {
      vec2 uv = 2. * (vUv - .5) * uResolution / min(uResolution.x, uResolution.y);
      float dist = distance(uv, uPointerPosition);
      float circleMask = 1. - smoothstep(.137, .143, dist);
      vec3 circle = mix(vec3(0.), uCircleColor, circleMask);
      gl_FragColor = vec4(circle, 1.);
    }
  `,
  uniforms: {
    uPointerPosition: [0, 0],
    uCircleColor: [1, 1, 1],
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});

const targetPointer = { x: 0, y: 0 };
const speed = 0.07;

onPointerEvents(canvas, {
  move: ({ pointer, boundingRect, center }) => {
    const minDimension = Math.min(boundingRect.width, boundingRect.height);
    targetPointer.x = (pointer.x - center.x) / (minDimension / 2);
    targetPointer.y = (center.y - pointer.y) / (minDimension / 2);
  },
  down: () => {
    uniforms.uCircleColor = [1, 0, 0];
  },
  up: () => {
    uniforms.uCircleColor = [1, 1, 1];
  },
  leave: () => {
    targetPointer.x = 0;
    targetPointer.y = 0;
  },
});

loop(() => {
  const currentPointerCoord = {
    x: uniforms.uPointerPosition[0],
    y: uniforms.uPointerPosition[1],
  };
  const distanceX = targetPointer.x - currentPointerCoord.x;
  const distanceY = targetPointer.y - currentPointerCoord.y;

  if (Math.abs(distanceX) < 0.001 && Math.abs(distanceY) < 0.001) {
    return;
  }

  uniforms.uPointerPosition = [
    currentPointerCoord.x + distanceX * speed,
    currentPointerCoord.y + distanceY * speed,
  ];
});

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.firstChild!.nodeValue = `${Number(renderCount.textContent) + 1}`;
});
