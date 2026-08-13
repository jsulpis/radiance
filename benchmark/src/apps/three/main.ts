import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

const canvas = document.querySelector("canvas");

const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new Scene();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

const material = new ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = position.xy * 0.5 + 0.5;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: await fetch("/shaders/fullscreen.frag").then((res) => res.text()),
  uniforms: { uTime: { value: 0 } },
});

const mesh = new Mesh(new PlaneGeometry(2, 2), material);
scene.add(mesh);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}

function render(time: number) {
  material.uniforms.uTime.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(render);
