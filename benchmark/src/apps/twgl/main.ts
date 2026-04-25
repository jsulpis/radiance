import {
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js";

const canvas = document.querySelector("canvas");
const vertexShader = await fetch("/shaders/fullscreen.vert").then((res) => res.text());
const fragmentShader = await fetch("/shaders/fullscreen.frag").then((res) => res.text());

const gl = canvas.getContext("webgl2")!;

if (!gl) {
  throw new Error("WebGL is not supported in this browser.");
}

const programInfo = createProgramInfo(gl, [vertexShader, fragmentShader]);
const bufferInfo = createBufferInfoFromArrays(gl, {
  position: {
    numComponents: 2,
    data: [-1, -1, 3, -1, -1, 3],
  },
});

function resize() {
  resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, window.devicePixelRatio);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function render(time: number) {
  gl.useProgram(programInfo.program);
  setBuffersAndAttributes(gl, programInfo, bufferInfo);
  setUniforms(programInfo, { uTime: time * 0.001 });
  drawBufferInfo(gl, bufferInfo);
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(render);
