<template>
  <Sandpack
    theme="dark"
    template="vanilla-ts"
    :files="files"
    :options="options"
    :custom-setup="{
      dependencies,
    }"
  >
    <slot />
  </Sandpack>
</template>

<script setup lang="ts">
import { Sandpack } from "sandpack-vue3";
import type { SandpackFiles, SandpackOptions } from "sandpack-vue3";
import localLib from "../../lib/dist/index.js?raw";

const props = defineProps<{
  sourceFiles: string;
  deps?: string | Record<string, string>;
  options?: SandpackOptions;
}>();

const sourceFiles = JSON.parse(decodeURIComponent(props.sourceFiles)) as {
  info: string;
  code: string;
}[];

const exampleFiles: SandpackFiles = Object.fromEntries(
  sourceFiles.flatMap(({ info, code }) => {
    const bracketPath = info.match(/\[([^\]]+)\]/)?.[1];
    const path = bracketPath || info.split(" ").find((value) => value.startsWith("/"));
    if (!path) return [];

    return [[path.startsWith("/") ? path : `/${path}`, { code }]];
  }),
);

const files = {
  ...exampleFiles,
  "/node_modules/@radiancejs/gl/package.json": {
    code: JSON.stringify({
      name: "@radiancejs/gl",
      main: "./index.js",
    }),
    hidden: true,
  },
  "/node_modules/@radiancejs/gl/index.js": {
    code: localLib,
    hidden: true,
  },
};

const dependencies =
  typeof props.deps === "string"
    ? Object.fromEntries(
        props.deps.split(",").map((dependency) => {
          const separator = dependency.lastIndexOf("@");
          return [dependency.slice(0, separator).trim(), dependency.slice(separator + 1).trim()];
        }),
      )
    : props.deps;

const options = {
  ...props.options,
  showOpenInCodeSandbox: true,
  showConsoleButton: true,
};
</script>
