import { glCanvas } from "@radiancejs/gl";
import fragment from "./mesh.frag?raw";
import vertex from "./mesh.vert?raw";
import "./styles.css";

// A grid of (N + 1)² vertices, each reused by up to 6 triangles
// thanks to the index buffer.
const N = 30;

const positions: number[] = [];
const indices: number[] = [];

for (let y = 0; y <= N; y++) {
  for (let x = 0; x <= N; x++) {
    positions.push((x / N) * 2 - 1, (y / N) * 2 - 1);

    // a cell can only be emitted once its four corners exist,
    // which is the case everywhere except on the last row/column
    if (x < N && y < N) {
      const i = y * (N + 1) + x;
      // both triangles end on the same corner so flat shading
      // gives one color per cell instead of a diagonal seam
      indices.push(i, i + 1, i + N + 1, i + 1, i + N + 2, i + N + 1);
    }
  }
}

glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  attributes: {
    aPosition: { size: 2, data: positions },
    index: { size: 1, data: indices },
  },
  uniforms: {
    uTime: ({ time }) => time / 1000,
  },
  depthTest: true,
});
