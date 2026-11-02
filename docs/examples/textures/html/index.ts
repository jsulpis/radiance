import { glCanvas } from "@radiancejs/gl";
import "./styles.css";

const canvas = document.querySelector("canvas")!;
const card = document.querySelector("article")!;

glCanvas({
  canvas,
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main() {
      gl_FragColor = texture(uTexture, vUv);
    }
  `,
  uniforms: {
    uTexture: { src: card },
  },
});
