import { glCanvas, linearToneMapping, trails } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import vertex from "./particles.vert?raw";
import "./styles.css";

const count = 100;

const trailsEffect = trails();

const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec4 vColor;
    void main() {
      vec2 uv = gl_PointCoord.xy;
      gl_FragColor.a = vColor.a * smoothstep(0.5, 0.4, length(uv - 0.5));
      gl_FragColor.rgb = vColor.rgb * gl_FragColor.a;
    }
  `,
  vertex,
  attributes: {
    random: {
      data: Array.from({ length: count * 3 }).map(() => Math.random()),
      size: 3,
    },
  },
  uniforms: {
    uParticleSize: 3,
    uTime: ({ time }) => time / 500,
  },
  blending: "normal",
  postEffects: [trailsEffect, linearToneMapping()],
});

const pane = new Pane();

const particlesParams = pane.addFolder({ title: "Particles" });
particlesParams.addBinding(uniforms, "uParticleSize", {
  min: 3,
  max: 20,
  step: 1,
  label: "Size",
});

const trailsParams = pane.addFolder({ title: "Trails Effect" });
trailsParams.addBinding(trailsEffect.uniforms, "uFadeout", { min: 0, max: 1, step: 0.01 });
trailsParams.addBinding(trailsEffect.uniforms, "uErosion", { min: 0, max: 0.5, step: 0.01 });
trailsParams
  .addBinding({ uTailColor: { r: 1, g: 1, b: 1 } }, "uTailColor", {
    color: { type: "float" },
  })
  .on("change", ({ value }) => {
    trailsEffect.uniforms.uTailColor = [value.r, value.g, value.b, 1];
  });
trailsParams.addBinding(trailsEffect.uniforms, "uTailColorFalloff", {
  min: 0,
  max: 1,
  step: 0.01,
});
