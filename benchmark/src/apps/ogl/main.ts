import { Mesh, Program, Renderer, Triangle } from "ogl";

const canvas = document.querySelector("canvas");

const renderer = new Renderer({
  canvas,
  antialias: false,
  alpha: false,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
});

const { gl } = renderer;
const geometry = new Triangle(gl);
const program = new Program(gl, {
  vertex: await fetch("/shaders/fullscreen.vert").then((res) => res.text()),
  fragment: await fetch("/shaders/fullscreen.frag").then((res) => res.text()),
  uniforms: { uTime: { value: 0 } },
});
const mesh = new Mesh(gl, { geometry, program });

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(time: number) {
  program.uniforms.uTime.value = time * 0.001;
  renderer.render({ scene: mesh });
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(render);
