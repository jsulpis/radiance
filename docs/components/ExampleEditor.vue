<template>
  <Sandbox
    template="vanilla-ts"
    :code-options="codeOptions"
    :options="{ ...props }"
    :custom-setup="{
      ...props,
      deps: {
        ...deps,
        '@radiancejs/gl': '0.11.1',
      },
    }"
  >
    <slot />
  </Sandbox>
</template>

<script setup lang="ts">
import { Sandbox, sandboxProps } from "vitepress-plugin-sandpack";
import { computed } from "vue";

const props = defineProps(sandboxProps);

const deps = computed(() => Object.fromEntries([((props.deps as string) || "").split("@")]));
</script>
