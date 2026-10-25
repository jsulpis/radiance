import { ditherBayer, glCanvas } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import fragment from "./gradient.frag?raw";
import "./styles.css";

const ditherEffect = ditherBayer({ matrix: 8, size: 2 });

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uTime: ({ time }) => time / 1000,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
  postEffects: [ditherEffect],
});

const pane = new Pane({ title: "Dither" });
pane.addBinding(ditherEffect.uniforms, "uMatrix", {
  options: { "2x2": 2, "4x4": 4, "8x8": 8 },
});
pane.addBinding(ditherEffect.uniforms, "uSize", { min: 1, max: 4, step: 1 });
pane.addBinding(ditherEffect.uniforms, "uLevels", { min: 2, max: 6, step: 1 });
pane.addBinding(ditherEffect.uniforms, "uColor");
