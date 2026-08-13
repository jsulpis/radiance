import { glCanvas, glContext, loop, pingPongFBO } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import "./styles.css";
import boidsPositions from "./positions.frag?raw";
import boidsVelocities from "./velocities.frag?raw";
import renderPassVertex from "./render.vert?raw";
import renderPassFragment from "./render.frag?raw";

const { gl, canvas } = glContext({ canvas: "#glCanvas" });

const count = 300;

const velocities = pingPongFBO({
  gl,
  fragment: boidsVelocities,
  uniforms: {
    uDeltaTime: 0,
    uPerceptionRadius: 0.1,
    uMaxSpeed: 0.4,
    uSeparationWeight: 1.5,
    uAlignmentWeight: 1.0,
    uCohesionWeight: 0.8,
    uBorderForce: 1,
    uBorderDistance: 0.8,
    uPredatorRepulsionStrength: 2.5,
    uPredatorRepulsionRadius: 1,
    tPositions: () => positions.texture,
  },
  dataTexture: {
    name: "tVelocities",
    initialData: Array.from({ length: count }).flatMap(() => [
      /* R */ Math.random() * 0.2 - 0.1,
      /* G */ Math.random() * 0.2 - 0.1,
      /* B */ 0,
      /* A */ 0,
    ]),
  },
});

const positions = pingPongFBO({
  gl,
  fragment: boidsPositions,
  uniforms: {
    uDeltaTime: 0,
    tVelocities: () => velocities.texture,
  },
  dataTexture: {
    name: "tPositions",
    initialData: Array.from({ length: count }).flatMap(() => [
      /* R */ Math.random() * 2 - 1,
      /* G */ Math.random() * 2 - 1,
      /* B */ 0,
      /* A */ 0,
    ]),
  },
});

const renderPass = glCanvas({
  canvas,
  vertex: renderPassVertex,
  fragment: renderPassFragment,
  uniforms: {
    tPositions: () => positions.texture,
    tVelocities: () => velocities.texture,
  },
  attributes: {
    aCoords: positions.coords,
  },
  blending: "normal",
});

loop(({ deltaTime }) => {
  velocities.uniforms.uDeltaTime = deltaTime / 500;
  velocities.render();

  positions.uniforms.uDeltaTime = deltaTime / 500;
  positions.render();

  renderPass.render();
});

const pane = new Pane({ title: "Uniforms", expanded: false });
pane.addBinding(velocities.uniforms, "uMaxSpeed", { min: 0.2, max: 0.8 });

const flocking = pane.addFolder({ title: "Flocking" });
flocking.addBinding(velocities.uniforms, "uAlignmentWeight", { min: 0.5, max: 1.5 });
flocking.addBinding(velocities.uniforms, "uSeparationWeight", { min: 1, max: 2 });
flocking.addBinding(velocities.uniforms, "uCohesionWeight", { min: 0.5, max: 1.5 });

const predator = pane.addFolder({ title: "Predator" });
predator.addBinding(velocities.uniforms, "uPredatorRepulsionStrength", { min: 1, max: 3 });
predator.addBinding(velocities.uniforms, "uPredatorRepulsionRadius", { min: 0.5, max: 1.5 });
