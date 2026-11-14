<script setup lang="ts">
import { bloom, ditherHalftone, glCanvas, hableToneMapping } from "@radiancejs/gl";
import { onBeforeUnmount, onMounted, ref } from "vue";
import fragment from "../examples/post-processing-builtin/dither/gradient.frag?raw";

const canvas = ref<HTMLCanvasElement>();
const unavailable = ref(false);
let instance: ReturnType<typeof glCanvas> | undefined;
let motionQuery: MediaQueryList | undefined;

function handleMotionPreference(event: MediaQueryListEvent) {
  if (event.matches) {
    instance?.pause();
  } else {
    instance?.play();
  }
}

onMounted(() => {
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  try {
    instance = glCanvas({
      canvas: canvas.value!,
      fragment,
      uniforms: {
        uTime: ({ time }) => time / 1000,
        uResolution: ({ canvasResolution }) => canvasResolution,
      },
      postEffects: [
        bloom({ radius: 0.6 }),
        hableToneMapping({ exposure: 2, outputColorSpace: "linear" }),
        ditherHalftone({ size: 6 }),
      ],
    });

    if (motionQuery.matches) {
      instance.pause();
    }

    motionQuery.addEventListener("change", handleMotionPreference);
  } catch {
    unavailable.value = true;
  }
});

onBeforeUnmount(() => {
  motionQuery?.removeEventListener("change", handleMotionPreference);
  instance?.dispose();
});
</script>

<template>
  <div class="bloom-preview">
    <canvas ref="canvas" aria-label="A dithered lit sphere glowing with bloom"></canvas>
    <span v-if="unavailable">Preview requires WebGL2.</span>
    <span v-else>Bloom + HDR Tone Mapping + Dither</span>
  </div>
</template>

<style scoped>
.bloom-preview {
  position: relative;
  height: 100%;
  min-height: 220px;
  overflow: hidden;
  border: 1px solid #2a3442;
  border-radius: 8px;
  background: #070a10;
}
canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
span {
  position: absolute;
  bottom: 12px;
  left: 16px;
  color: #aab8ca;
  font: 0.625rem/1.5 var(--vp-font-family-mono);
  letter-spacing: 0.1em;
}
</style>
