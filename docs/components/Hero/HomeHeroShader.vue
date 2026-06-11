<script setup lang="ts">
import {
  cineonToneMapping,
  effectPass,
  glCanvas,
  glContext,
  loop,
  onPointerEvents,
  pingPongFBO,
  trails,
} from "@radiancejs/gl";
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
  uPointer: [number, number];
  uDpr: number;
};

const PARTICLE_COUNT = 400;
const BASE_RADIUS = 1;
const BASE_COLOR: [number, number, number] = [1, 1, 1];
const MAIN_COLOR: [number, number, number] = [0, 0.6, 1];
const canvasEl = ref<HTMLCanvasElement | null>(null);

function createInitialState(count: number) {
  const state = new Float32Array(count * 4);

  for (let index = 0; index < count; index++) {
    state[index * 4 + 3] = Math.random() - 1; // initial lifetime value between -1 and 0
  }

  return state;
}

onMounted(() => {
  const canvas = canvasEl.value;

  if (!canvas) {
    return;
  }

  const { gl } = glContext(canvas, { colorSpace: "display-p3" });

  const simulationPass = pingPongFBO(gl, {
    fragment: simulationFragment,
    dataTexture: {
      name: "tParticles",
      initialData: createInitialState(PARTICLE_COUNT),
    },
    uniforms: {
      uCount: PARTICLE_COUNT,
      uBaseRadius: BASE_RADIUS,
      uDeltaTime: 0,
      uPointer: [1, 1],
    },
  });

  const halo = effectPass({
    fragment: haloFragment,
    uniforms: {
      uBaseRadius: BASE_RADIUS,
      uBaseColor: BASE_COLOR,
      uMainColor: MAIN_COLOR,
      uTime: 0,
    },
  });

  const pointerTarget = { x: 0.75, y: 0 };
  const pointerState = { ...pointerTarget };

  const renderPass = glCanvas<RenderUniforms>({
    canvas,
    vertex,
    fragment,
    uniforms: {
      uParticles: () => simulationPass.texture,
      uBaseColor: BASE_COLOR,
      uMainColor: MAIN_COLOR,
      uBaseRadius: BASE_RADIUS,
      uPointer: [pointerState.x, pointerState.y],
      uDpr: Math.min(devicePixelRatio, 2),
    },
    attributes: {
      aCoords: simulationPass.coords,
    },
    postEffects: [trails({ fadeout: 0.15 }), halo, cineonToneMapping()],
    blending: "additive",
  });

  const pointerEvents = onPointerEvents(canvas, {
    move: ({ pointer, boundingRect, center }) => {
      const centerX = center.x;
      const centerY = center.y;

      pointerTarget.x = (pointer.x - centerX) / (boundingRect.width * 0.5);
      pointerTarget.y = (centerY - pointer.y) / (boundingRect.height * 0.5);
    },
  });

  const animationLoop = loop(({ time, deltaTime }) => {
    const pointerLerp = deltaTime / 1000;
    pointerState.x += (pointerTarget.x - pointerState.x) * pointerLerp;
    pointerState.y += (pointerTarget.y - pointerState.y) * pointerLerp;

    simulationPass.uniforms.uPointer = [pointerState.x, pointerState.y];
    simulationPass.uniforms.uDeltaTime = deltaTime * 0.75;
    simulationPass.render();

    halo.uniforms.uTime = time;

    renderPass.uniforms.uPointer = [pointerState.x, pointerState.y];
    renderPass.render();
  });

  function handleVisibilityChange() {
    if (document.hidden) {
      animationLoop?.pause();
    } else {
      animationLoop?.play();
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    animationLoop?.pause();
    pointerEvents?.stop();
  });
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
  right: 20%;

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

:global(body:has(.VPHomeHero)) {
  background:
    radial-gradient(circle at 80% -5%, rgb(0 100 255 / 0.3), transparent 100vmin),
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
