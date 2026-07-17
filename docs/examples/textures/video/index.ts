import { glCanvas, loadVideoTexture } from "@radiancejs/gl";
import "./styles.css";

glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main() {
      vec3 color = texture(uTexture, vUv).rgb;

      // try playing with the colors here
      //color = color.bgr;

      gl_FragColor = vec4(color, 1.);
    }
  `,
  uniforms: {
    uTexture: loadVideoTexture(
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    ),
  },
});
