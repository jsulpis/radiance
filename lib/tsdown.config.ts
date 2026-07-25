import { defineConfig } from "tsdown";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "browser",
  exports: true,
  plugins: [glsl({ minify: true })],
  publint: {
    strict: true,
  },
  attw: {
    profile: "esm-only",
    level: "error",
  },
});
