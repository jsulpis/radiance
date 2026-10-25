import { glCanvas, loadVideoTexture, pixelate } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import "./styles.css";

const pixelateEffect = pixelate({ size: 8 });

glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    in vec2 vUv;
    uniform sampler2D uTexture;
    out vec4 fragColor;

    void main() {
      fragColor = texture(uTexture, vUv);
    }
  `,
  uniforms: {
    uTexture: loadVideoTexture(
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    ),
  },
  postEffects: [pixelateEffect],
});

const pane = new Pane({ title: "Pixelate" });
pane.addBinding(pixelateEffect.uniforms, "uSize", { min: 1, max: 32, step: 1 });
