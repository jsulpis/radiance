import { glCanvas } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import fragment from "./uniforms.frag?raw";
import "./styles.css";

const { uniforms, onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uRadius: 0.03,
    uSize: 0.2,
    uRotation: 0.1,
    uPosition: [0.5, 0.5],
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
});

const pane = new Pane({ title: "Uniforms" });

// updating the uniforms object will trigger a re-render
pane.addBinding(uniforms, "uSize", { min: 0.01, max: 0.3 });
pane.addBinding(uniforms, "uRadius", { min: 0, max: 0.2 });
pane.addBinding(uniforms, "uRotation", { min: 0, max: 2 * Math.PI });

pane
  .addBinding({ uPosition: { x: 0.5, y: 0.5 } }, "uPosition", {
    x: { min: -1, max: 1 },
    y: { min: -1, max: 1 },
  })
  .on("change", (e) => {
    // uniforms.uPosition is typed : [number, number]
    uniforms.uPosition = [e.value.x / 2 + 0.5, -e.value.y / 2 + 0.5];
  });

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.textContent = `${Number(renderCount.textContent) + 1}`;
});
