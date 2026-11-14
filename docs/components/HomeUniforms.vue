<script setup lang="ts">
import { glCanvas } from "@radiancejs/gl";
import { onBeforeUnmount, onMounted, ref } from "vue";
import fragment from "../examples/basics/uniforms/uniforms.frag?raw";

const canvas = ref<HTMLCanvasElement>();
const warp = ref(2.8);
const renders = ref(0);
const unavailable = ref(false);
let instance: ReturnType<typeof glCanvas> | undefined;

onMounted(() => {
  try {
    instance = glCanvas({
      canvas: canvas.value!,
      fragment,
      uniforms: {
        uWarp: warp.value,
        uLacunarity: 3.2,
        uScale: 1.4,
        uResolution: ({ canvasResolution }) => canvasResolution,
      },
    });
    instance.onAfterRender(() => renders.value++);
  } catch {
    unavailable.value = true;
  }
});

function updateWarp(event: Event) {
  warp.value = Number((event.target as HTMLInputElement).value);
  if (instance) instance.uniforms.uWarp = warp.value;
}

onBeforeUnmount(() => instance?.dispose());
</script>

<template>
  <div class="uniform-preview">
    <div class="uniform-preview__bar"><span>SHADER OUTPUT</span></div>
    <div class="uniform-preview__canvas">
      <canvas ref="canvas" aria-label="Shader output responding to the warp control"></canvas>
      <p v-if="unavailable" class="uniform-preview__fallback">
        This preview needs WebGL2. You can still explore the example and its source.
      </p>
      <span v-else class="uniform-preview__count"
        >Renders <strong>{{ String(renders).padStart(2, "0") }}</strong></span
      >
    </div>
    <div class="uniform-preview__control">
      <label for="home-warp">uWarp <span>Uniform</span></label>
      <input
        id="home-warp"
        type="range"
        min="1"
        max="5"
        step="0.1"
        :value="warp"
        :disabled="unavailable"
        @input="updateWarp"
      />
      <output for="home-warp">{{ warp.toFixed(1) }}</output>
    </div>
  </div>
</template>

<style scoped lang="scss">
.uniform-preview {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #2a3442;
  border-radius: 8px;
  background: #0c1118;

  &__bar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 14px 20px;
    border-bottom: 1px solid #2a3442;
    color: #aab8ca;
    font: 0.625rem/1.4 var(--vp-font-family-mono);
    letter-spacing: 0.1em;
  }
  &__canvas {
    position: relative;
    flex: 1;
    min-height: 300px;
    background: #121b2c;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  &__count {
    position: absolute;
    bottom: 14px;
    left: 16px;
    padding: 7px 11px;
    color: #dbe8f9;
    background: #0b111dcc;
    border: 1px solid #ffffff24;
    border-radius: 3px;
    font: 0.75rem/1.4 var(--vp-font-family-mono);
  }
  &__count strong {
    color: white;
    margin-left: 6px;
  }
  &__fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    padding: 24px;
    color: #d7e1ed;
    text-align: center;
  }
  &__control {
    display: grid;
    grid-template-columns: auto 1fr 2.5ch;
    align-items: center;
    gap: 18px;
    padding: 18px 20px;
    border-top: 1px solid #2a3442;
  }
  label {
    color: #e8eef8;
    font: 0.75rem var(--vp-font-family-mono);
  }
  label span {
    display: block;
    margin-top: 4px;
    color: #98a8bb;
    font: 0.6875rem var(--vp-font-family-base);
  }
  input {
    width: 100%;
    accent-color: #80aeff;
    cursor: pointer;
  }
  output {
    color: #c5d9ff;
    font: 0.75rem var(--vp-font-family-mono);
  }
  @media (max-width: 719px) {
    &__canvas {
      min-height: 280px;
    }
  }
}
</style>
