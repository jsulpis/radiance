import { glCanvas } from "@radiancejs/gl";
import fragment from "./galaxy.frag?raw";
import vertex from "./galaxy.vert?raw";
import "./styles.css";

const count = 6000;

glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  attributes: {
    random: {
      data: Array.from({ length: count * 3 }).map(() => Math.random()),
      size: 3,
    },
  },
  uniforms: {
    uTime: ({ time }) => time / 1000,
    uResolution: ({ canvasResolution }) => canvasResolution,
  },
  blending: "additive",
});
