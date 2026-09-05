import { glCanvas } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import vertex from "./vertex.frag?raw";
import fragment from "./uniforms.frag?raw";
import "./styles.css";

const { uniforms, onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  uniforms: {
    uWarp: 2.8,
    uLacunarity: 3.2,
    uScale: 1.4,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});

const pane = new Pane({ title: "Uniforms" });

// updating the uniforms object will trigger a re-render
pane.addBinding(uniforms, "uWarp", { label: "Warp", min: 1, max: 5 });
pane.addBinding(uniforms, "uLacunarity", { label: "Lacunarity", min: 2, max: 4 });
pane.addBinding(uniforms, "uScale", { label: "Scale", min: 0.5, max: 4 });

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.firstChild!.nodeValue = `${Number(renderCount.textContent) + 1}`;
});
