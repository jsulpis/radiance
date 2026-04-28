<script setup lang="ts">
import { useData } from "vitepress";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import fragment from "./home-hero.frag?raw";
import simulationFragment from "./home-hero-sim.frag?raw";
import vertex from "./home-hero.vert?raw";

type RenderUniforms = {
  uTheme: number;
  uPositions: unknown;
};

type RenderPass = {
  uniforms: RenderUniforms;
  render: () => void;
};

type SimulationUniforms = {
  uDeltaTime: number;
  uPointer: [number, number];
};

type SimulationPass = {
  uniforms: SimulationUniforms;
  render: () => void;
  texture: unknown;
  coords: {
    data: Float32Array;
    size: number;
  };
};

type LoopInstance = {
  pause: () => void;
};

const PARTICLE_COUNT = 10;
const canvasEl = ref<HTMLCanvasElement | null>(null);
const { isDark } = useData();

let renderPass: RenderPass | null = null;
let simulationPass: SimulationPass | null = null;
let animationLoop: LoopInstance | null = null;
let cleanupPointerEvents: (() => void) | null = null;

function createInitialState(count: number) {
  const state = new Float32Array(count * 4);
  const sourceY = 1 - 1 / count;
  const sourceRadius = Math.sqrt(Math.max(0, 1 - sourceY * sourceY)) * 0.9;

  for (let index = 0; index < count; index++) {
    state[index * 4] = sourceRadius;
    state[index * 4 + 1] = sourceY * 0.9;
    state[index * 4 + 2] = 0;
    state[index * 4 + 3] = 0;
  }

  return state;
}

function syncTheme() {
  if (!renderPass) {
    return;
  }

  renderPass.uniforms.uTheme = isDark.value ? 1 : 0;
  renderPass.render();
}

watch(isDark, syncTheme);

onMounted(async () => {
  if (!canvasEl.value) {
    return;
  }

  const radiance = await import("@radiancejs/gl");
  const { gl } = radiance.glContext(canvasEl.value, { colorSpace: "display-p3" });

  simulationPass = radiance.pingPongFBO<SimulationUniforms>(gl, {
    fragment: simulationFragment,
    uniforms: {
      uDeltaTime: 0,
      uPointer: [0, 0],
    },
    dataTexture: {
      name: "tPositions",
      initialData: createInitialState(PARTICLE_COUNT),
    },
  });

  renderPass = radiance.glCanvas<RenderUniforms>({
    canvas: canvasEl.value,
    vertex,
    fragment,
    uniforms: {
      uPositions: () => simulationPass?.texture,
      uTheme: isDark.value ? 1 : 0,
    },
    attributes: {
      aCoords: simulationPass.coords,
    },
    blending: "normal",
    colorSpace: "display-p3",
  });
  syncTheme();

  const pointerEvents = radiance.onPointerEvents(canvasEl.value, {
    move: ({ pointer, canvasCenter, canvasRect }) => {
      if (!simulationPass) {
        return;
      }

      simulationPass.uniforms.uPointer = [
        (pointer.x - canvasCenter.x) / canvasRect.width,
        (pointer.y - canvasCenter.y) / canvasRect.height,
      ];
    },
    leave: () => {
      if (!simulationPass) {
        return;
      }

      simulationPass.uniforms.uPointer = [0, 0];
    },
  });
  cleanupPointerEvents = () => {
    pointerEvents.stop();
  };

  animationLoop = radiance.loop(({ deltaTime }) => {
    if (!simulationPass || !renderPass) {
      return;
    }

    simulationPass.uniforms.uDeltaTime = Math.min(deltaTime, 32) / 1000;
    simulationPass.render();
    renderPass.render();
  });
});

onBeforeUnmount(() => {
  cleanupPointerEvents?.();
  animationLoop?.pause();
});
</script>

<template>
  <div class="home-hero-shader" :class="{ 'is-dark': isDark }">
    <div class="home-hero-shader__frame">
      <canvas ref="canvasEl" class="home-hero-shader__canvas"></canvas>
      <div class="home-hero-shader__glow"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-hero-shader {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &__frame {
    position: relative;
    width: min(100%, 420px);
    aspect-ratio: 1 / 1;
    border-radius: 28px;
    overflow: hidden;
    background: rgb(255 255 255);
    pointer-events: auto;
  }

  &__canvas,
  &__glow {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  &__canvas {
    display: block;
  }

  &__glow {
    background: none;
    mix-blend-mode: normal;
    pointer-events: none;
  }

  &::before {
    content: "";
    position: absolute;
    width: min(70%, 260px);
    aspect-ratio: 1 / 1;
    border-radius: 999px;
    background: none;
    filter: blur(34px);
    opacity: 0;
  }

  @media (min-width: 960px) {
    justify-content: flex-end;
  }
}

.home-hero-shader.is-dark {
  &::before {
    background: none;
    opacity: 0;
  }

  .home-hero-shader__frame {
    background: rgb(0 0 0);
  }

  .home-hero-shader__glow {
    background: none;
  }
}

:global(.VPHomeHero .image-container) {
  width: min(100%, 440px);
  height: min(100vw - 48px, 440px);
}

@media (min-width: 640px) {
  :global(.VPHomeHero .image-container) {
    width: min(100%, 460px);
    height: min(100vw - 96px, 460px);
  }
}

@media (min-width: 960px) {
  :global(.VPHomeHero .image-container) {
    height: 100%;
    min-height: 420px;
  }
}
</style>
