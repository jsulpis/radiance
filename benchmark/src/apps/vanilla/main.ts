const canvas = document.querySelector("canvas");
const vertexShader = await fetch("/shaders/fullscreen.vert").then((res) => res.text());
const fragmentShader = await fetch("/shaders/fullscreen.frag").then((res) => res.text());

const gl = canvas.getContext("webgl2")!;

if (!gl) {
  throw new Error("WebGL is not supported in this browser.");
}

const positionBuffer = gl.createBuffer();
const program = createProgram(gl, vertexShader, fragmentShader);
const positionLocation = gl.getAttribLocation(program, "position");
const timeLocation = gl.getUniformLocation(program, "uTime");

if (!positionBuffer || !timeLocation) {
  throw new Error("Failed to initialize WebGL resources.");
}

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

function resize() {
  const devicePixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const width = Math.round(window.innerWidth * devicePixelRatio);
  const height = Math.round(window.innerHeight * devicePixelRatio);

  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
}

function render(time: number) {
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1f(timeLocation, time * 0.001);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(render);

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Failed to create shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Failed to create program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown program linking error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export {};
