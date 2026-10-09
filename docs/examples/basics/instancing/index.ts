import { glCanvas } from "@radiancejs/gl";
import fragment from "./cube.frag?raw";
import vertex from "./cube.vert?raw";
import { mat4 } from "gl-matrix";
import "./styles.css";

// One cube: 6 faces of 4 vertices, shared between all instances through
// an index buffer (24 vertices, 36 indices).
const CUBE_FACES: [normal: number[], corners: number[][]][] = [
  [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
  [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]],
  [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
  [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
  [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
  [[-1, 0, 0], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]]],
];

const positions: number[] = [];
const normals: number[] = [];
const indices: number[] = [];

for (const [normal, corners] of CUBE_FACES) {
  const first = positions.length / 3;
  for (const corner of corners) {
    positions.push(...corner);
    normals.push(...normal);
  }
  indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
}

/** Deterministic pseudo-random in [0, 1). */
function hash(i: number) {
  const value = Math.sin(i * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

// One row per instance: where the cube sits in 3D, how big it is,
// its color, and the phase of its spin.
const instanceCount = 150;
const offsets: number[] = [];
const scales: number[] = [];
const colors: number[] = [];
const phases: number[] = [];

for (let i = 0; i < instanceCount; i++) {
  offsets.push((hash(i) - 0.5) * 10, (hash(i + 100) - 0.5) * 7, (hash(i + 200) - 0.5) * 10);
  scales.push(0.15 + 0.35 * hash(i + 300));
  colors.push(0.2 + 0.6 * hash(i + 400), 0.45 + 0.35 * hash(i + 500), 0.65 + 0.3 * hash(i + 600));
  phases.push(hash(i + 700) * Math.PI * 2);
}

const viewMatrix = mat4.lookAt(mat4.create(), [0, 5, 16], [0, 0, 0], [0, 1, 0]);
const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 4, 1, 0.1, 100);

glCanvas({
  canvas: "#glCanvas",
  depthTest: true,
  uniforms: {
    uViewMatrix: viewMatrix,
    uProjectionMatrix: projectionMatrix,
    uLightPosition: [5, 8, 5],
    uTime: ({ time }) => time / 1000,
  },
  vertex,
  fragment,
  attributes: {
    // the mesh, read once per vertex
    aPosition: { size: 3, data: positions },
    aNormal: { size: 3, data: normals },
    index: { size: 1, data: indices },
    // the copies, read once per instance
    aInstanceOffset: { size: 3, data: offsets, divisor: 1 },
    aInstanceScale: { size: 1, data: scales, divisor: 1 },
    aInstanceColor: { size: 3, data: colors, divisor: 1 },
    aInstancePhase: { size: 1, data: phases, divisor: 1 },
  },
});
