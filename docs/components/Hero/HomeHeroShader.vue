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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import simulationFragment from "./home-hero-sim.frag?raw";
import vertex from "./home-hero.vert?raw";
import fragment from "./home-hero.frag?raw";
import haloFragment from "./home-hero-halo.frag?raw";

type RenderUniforms = {
  uParticles: () => unknown;
  uBaseColor: [number, number, number];
  uMainColor: [number, number, number];
  uHighlightColor: [number, number, number];
  uBaseRadius: number;
  uPointer: [number, number];
  uPointerStrength: number;
  uEnergy: number;
  uResolution: (ctx: { canvasResolution: [number, number] }) => [number, number];
  uDpr: number;
};

const PARTICLE_COUNT = 400;
const BASE_RADIUS = 1;
const BASE_COLOR: [number, number, number] = [1, 1, 1];
const MAIN_COLOR: [number, number, number] = [0, 0.6, 1];
const HIGHLIGHT_COLOR: [number, number, number] = [0.55, 0.9, 1];
const canvasEl = ref<HTMLCanvasElement | null>(null);
const pointerZoneEl = ref<HTMLElement | null>(null);
const previewMessage = ref("");
const reducedMotion = ref(false);
const message = computed(
  () =>
    previewMessage.value ||
    (reducedMotion.value ? "Particle simulation paused for reduced motion." : ""),
);

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

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.value = motionQuery.matches;

  try {
    const { gl } = glContext({ canvas, colorSpace: "display-p3" });

    const simulationPass = pingPongFBO({
      gl,
      fragment: simulationFragment,
      dataTexture: {
        name: "tParticles",
        initialData: createInitialState(PARTICLE_COUNT),
      },
      uniforms: {
        uCount: PARTICLE_COUNT,
        uBaseRadius: BASE_RADIUS,
        uDeltaTime: 0,
        uTime: 0,
        uEnergy: 0,
      },
    });

    const halo = effectPass({
      fragment: haloFragment,
      uniforms: {
        uTexture: ({ inputPass }) => inputPass.target!.texture,
        uBaseRadius: BASE_RADIUS,
        uBaseColor: BASE_COLOR,
        uMainColor: MAIN_COLOR,
        uResolution: ({ passResolution }) => passResolution,
        uTime: ({ time }) => time,
      },
    });

    const pointerTarget = { x: 0, y: 0 };
    const pointerState = { ...pointerTarget };
    let pointerStrengthTarget = 0;
    let pointerStrength = 0;
    let energy = 0;

    const renderPass = glCanvas<RenderUniforms>({
      canvas,
      vertex,
      fragment,
      uniforms: {
        uParticles: () => simulationPass.texture,
        uBaseColor: BASE_COLOR,
        uMainColor: MAIN_COLOR,
        uHighlightColor: HIGHLIGHT_COLOR,
        uBaseRadius: BASE_RADIUS,
        uPointer: [pointerState.x, pointerState.y],
        uPointerStrength: 0,
        uEnergy: 0,
        uResolution: ({ canvasResolution }) => canvasResolution,
        uDpr: Math.min(window.devicePixelRatio || 1, 2),
      },
      attributes: {
        aCoords: simulationPass.coords,
      },
      postEffects: [trails({ fadeout: 0.15 }), halo, cineonToneMapping()],
      blending: "additive",
    });

    const pointerEvents = onPointerEvents(pointerZoneEl.value ?? canvas, {
      enter: () => {
        pointerStrengthTarget = 1;
      },
      move: ({ pointer }) => {
        // Normalize against the canvas, but listen on the larger pointer zone so the
        // interaction is reachable without having to aim at the sphere itself.
        const rect = canvas.getBoundingClientRect();

        const x = (pointer.x - (rect.x + rect.width * 0.5)) / (rect.width * 0.5);
        const y = (rect.y + rect.height * 0.5 - pointer.y) / (rect.height * 0.5);

        pointerTarget.x = Math.max(-1.2, Math.min(1.2, x));
        pointerTarget.y = Math.max(-1.2, Math.min(1.2, y));
        pointerStrengthTarget = 1;
      },
      leave: () => {
        pointerStrengthTarget = 0;
      },
    });

    const animationLoop = loop(
      ({ deltaTime: rawDeltaTime, time }) => {
        // Clamp the first frame after a pause to avoid a jump.
        const deltaTime = Math.min(rawDeltaTime, 64);
        const pointerLerp = 1 - Math.exp(-deltaTime / 90);
        pointerState.x += (pointerTarget.x - pointerState.x) * pointerLerp;
        pointerState.y += (pointerTarget.y - pointerState.y) * pointerLerp;

        // The lag between the target and the smoothed pointer is proportional to the
        // cursor speed, which makes a cheap and stable energy signal.
        const energyTarget = Math.min(
          1,
          Math.hypot(pointerTarget.x - pointerState.x, pointerTarget.y - pointerState.y) * 2.5,
        );
        energy += (energyTarget - energy) * (1 - Math.exp(-deltaTime / 160));
        pointerStrength +=
          (pointerStrengthTarget - pointerStrength) * (1 - Math.exp(-deltaTime / 220));

        simulationPass.uniforms.uEnergy = energy;
        simulationPass.uniforms.uTime = time;
        simulationPass.uniforms.uDeltaTime = deltaTime * 0.75;
        simulationPass.render();

        renderPass.uniforms.uPointer = [pointerState.x, pointerState.y];
        renderPass.uniforms.uPointerStrength = pointerStrength;
        renderPass.uniforms.uEnergy = energy;
        renderPass.render();
      },
      { immediate: !reducedMotion.value },
    );

    function setPaused(paused: boolean) {
      if (paused) {
        animationLoop.pause();
      } else {
        animationLoop.play();
      }
    }

    function handleVisibilityChange() {
      setPaused(document.hidden || reducedMotion.value);
    }

    function handleMotionPreference(event: MediaQueryListEvent) {
      reducedMotion.value = event.matches;
      setPaused(event.matches || document.hidden);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", handleMotionPreference);

    onBeforeUnmount(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionPreference);
      animationLoop.stop();
      pointerEvents?.stop();
      renderPass.dispose();
      simulationPass.dispose();
    });
  } catch {
    previewMessage.value = "Particle simulation requires WebGL2.";
  }
});
</script>

<template>
  <div class="home-hero-shader">
    <div ref="pointerZoneEl" class="home-hero-shader__pointer-zone" aria-hidden="true">
      <div class="ball"></div>
    </div>
    <canvas ref="canvasEl" aria-hidden="true"></canvas>
    <p v-if="message" class="home-hero-shader__message">{{ message }}</p>
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
    pointer-events: none;
  }

  &__pointer-zone {
    position: absolute;
    inset: -60%;
  }

  &__message {
    position: absolute;
    bottom: 0;
    color: #a4bad5;
    font: .625rem/1.5 var(--vp-font-family-mono);
    letter-spacing: 0.1em;
    text-align: center;
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
