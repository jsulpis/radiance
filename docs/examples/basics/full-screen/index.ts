import { glCanvas } from "@radiancejs/gl";
import "./styles.css";

glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 vUv; // provided by the default vertex shader
    uniform float uTime;

    void main() {
      gl_FragColor = vec4(vUv, sin(uTime) / 2. + .5, 1.);
    }
  `,
  uniforms: {
    uTime: ({ time }) => time / 500,
  },
});
