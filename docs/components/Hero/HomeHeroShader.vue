<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import simulationFragment from "./home-hero-sim.frag?raw";
import vertex from "./home-hero.vert?raw";
import fragment from "./home-hero.frag?raw";
import haloFragment from "./home-hero-halo.frag?raw";

type RenderUniforms = {
  uParticles: () => unknown;
  uBaseColor: [number, number, number];
  uMainColor: [number, number, number];
  uBaseRadius: number;
  uDpr: number;
};

type LoopInstance = {
  pause: () => void;
};

const PARTICLE_COUNT = 200;
const BASE_RADIUS = 1;
const MAIN_COLOR: [number, number, number] = [0, 0.6, 1];
const canvasEl = ref<HTMLCanvasElement | null>(null);

let animationLoop: LoopInstance | null = null;

function createInitialState(count: number) {
  const state = new Float32Array(count * 4);

  for (let index = 0; index < count; index++) {
    state[index * 4 + 3] = Math.random() * 2 - 2; // initial lifetime value
  }

  return state;
}

onMounted(async () => {
  const canvas = canvasEl.value;

  if (!canvas) {
    return;
  }

  const radiance = await import("@radiancejs/gl");
  const { gl } = radiance.glContext(canvas, { colorSpace: "display-p3" });
  const toneMapping = radiance.cineonToneMapping({ exposure: 1 });

  const simulationPass = radiance.pingPongFBO(gl, {
    fragment: simulationFragment,
    dataTexture: {
      name: "tParticles",
      initialData: createInitialState(PARTICLE_COUNT),
    },
    uniforms: {
      uCount: PARTICLE_COUNT,
      uBaseRadius: BASE_RADIUS,
      uDeltaTime: 0,
    },
  });

  simulationPass.render();

  const halo = radiance.effectPass({
    fragment: haloFragment,
    uniforms: {
      uBaseRadius: BASE_RADIUS,
      uMainColor: MAIN_COLOR,
      uTime: 0,
    },
  });

  const renderPass = radiance.glCanvas<RenderUniforms>({
    canvas,
    vertex,
    fragment,
    uniforms: {
      uParticles: () => simulationPass.texture,
      uBaseColor: [1, 1, 1],
      uMainColor: MAIN_COLOR,
      uBaseRadius: BASE_RADIUS,
      uDpr: Math.min(devicePixelRatio, 2),
    },
    attributes: {
      aCoords: simulationPass.coords,
    },
    colorSpace: "display-p3",
    postEffects: [radiance.trails({ fadeout: 0.15 }), halo, toneMapping],
    blending: "additive",
  });

  animationLoop = radiance.loop(({ time, deltaTime }) => {
    simulationPass.uniforms.uDeltaTime = deltaTime;
    simulationPass.render();

    halo.uniforms.uTime = time;
    renderPass.render();
  });
});

onBeforeUnmount(() => {
  animationLoop?.pause();
});
</script>

<template>
  <div class="home-hero-shader">
    <div class="home-hero-shader__pointer-zone" aria-hidden="true">
      <div class="ball"></div>
    </div>
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<style scoped lang="scss">
.home-hero-shader {
  position: absolute;
  width: min(100%, 400px);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  aspect-ratio: 1;

  canvas {
    position: absolute;
    max-height: 100%;
    max-width: 100%;
    aspect-ratio: 1;
    display: block;
    animation: fadeIn 3s 200ms ease backwards;
  }

  &__pointer-zone {
    position: absolute;
    inset: -60%;
  }
}

.ball {
  --size: 0.4;
  aspect-ratio: 1;
  width: calc(120% * var(--size));
  border-radius: 50%;
  background: linear-gradient(259.53deg, cyan 6.53%, blue 95.34%);
  filter: blur(10vmax);
  opacity: 0.6;
  position: absolute;
  z-index: -1;
  top: 0%;
  right: 15%;

  @media (max-width: 640px) {
    top: 40%;
    right: 45%;
    width: calc(160% * var(--size));
    transform: translate(50%, -50%);
    opacity: 0.2;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
}

:global(body) {
  background:
    radial-gradient(circle at top right, rgb(0 100 255 / 0.1), transparent 100vmin),
    linear-gradient(to bottom, rgb(0 0 255 / 0.1), black 80vh);
}

:global(#app) {
  overflow: hidden;
}

:global(.VPHomeHero .image) {
  margin-bottom: 0;
}

:global(.VPHomeHero .image-container) {
  justify-content: end;
}
</style>
