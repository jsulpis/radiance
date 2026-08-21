import { glCanvas } from "@radiancejs/gl";
import fragment from "./ray-tracing.frag?raw";
import "./styles.css";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    iTime: ({ time }) => time / 1000,
    iResolution: ({ canvasResolution }) => canvasResolution,
  },
});
