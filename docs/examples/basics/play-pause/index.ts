import { glCanvas } from "@radiancejs/gl";
import "./styles.css";

const { play, pause, canvas, onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 uv;
    uniform float uTime;
    #define RADIUS .1

    void main() {
      vec2 circleCenter = vec2(cos(uTime * .8) * .25 + .5, sin(uTime * .8) * .25 + .5);
      float circleMask = 1. - smoothstep(RADIUS*.99, RADIUS*1.01, length(uv - circleCenter));
      float gradient = 1. - length(uv - RADIUS - circleCenter) / (RADIUS * 2.);
      vec3 color = mix(vec3(0.1, 0.6, 0.4), vec3(0.41, 0.98, 0.84), gradient) * circleMask;

      gl_FragColor = vec4(color, 1.);
    }
  `,
  uniforms: {
    uTime: ({ time }) => time / 500,
  },
  immediate: false,
});

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.firstChild!.nodeValue = `${Number(renderCount.textContent) + 1}`;
});

canvas.addEventListener("pointerenter", play);
canvas.addEventListener("pointerleave", pause);
