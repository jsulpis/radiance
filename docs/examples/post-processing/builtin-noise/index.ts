import { glCanvas, noise } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import fragment from "./dots.frag?raw";
import "./styles.css";

const noiseEffect = noise({ intensity: 0.8, time: 0 });

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uTime: ({ time }) => time / 5000,
  },
  postEffects: [noiseEffect],
});

const pane = new Pane({ title: "Noise" });
pane.addBinding(noiseEffect.uniforms, "uIntensity", { min: 0, max: 1 });
pane.addBinding(noiseEffect.uniforms, "uSize", { min: 1, max: 5 });
pane.addBinding(noiseEffect.uniforms, "uColorMix", { min: 0, max: 1 });
pane.addBinding({ enabled: false }, "enabled", { label: "Animate" }).on("change", ({ value }) => {
  if (value) noiseEffect.uniforms.uTime = ({ time }) => time;
  else noiseEffect.uniforms.uTime = () => 0;
});
